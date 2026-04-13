import pandas as pd
import json
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.models.import_batch import ImportBatch
from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.title_settlement import TitleSettlement
from app.models.company import Company

def calculate_file_hash(file_contents: bytes) -> str:
    return hashlib.sha256(file_contents).hexdigest()

def _clean_raw_data(row: pd.Series) -> dict:
    import math
    cleaned = {}
    for k, v in row.to_dict().items():
        if pd.isna(v):
            continue
        if isinstance(v, float) and math.isnan(v):
            continue
        if isinstance(v, (datetime, pd.Timestamp)):
            cleaned[k] = v.isoformat()
        else:
            cleaned[k] = v
    return cleaned

def process_erp_import(
    db: Session, 
    file: UploadFile, 
    company_id: int, 
    user_id: int, 
    is_payable: bool
):
    # 1. Validar a empresa
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # 2. Ler e processar o arquivo (apenas memória)
    contents = file.file.read()
    file_hash = calculate_file_hash(contents)
    
    # Prevenir duplicidade do lote inteiro
    existing_batch = db.query(ImportBatch).filter(ImportBatch.file_hash == file_hash).first()
    if existing_batch:
        raise HTTPException(status_code=400, detail="Arquivo já importado anteriormente.")

    # Ler com Pandas
    try:
        import io
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.lower().endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use CSV ou XLSX.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {str(e)}")

    # Padronizar colunas para lower e sem espaço (simplificação)
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Mapas de colunas esperadas (Baseado no doc: Vencimento, Valor, Cliente/Fornecedor, Docto, Baixa, Valor Pago)
    col_vencimento = next((c for c in df.columns if 'vencimento' in c and 'real' not in c), None)
    col_venc_real = next((c for c in df.columns if 'vencimento real' in c), col_vencimento)
    col_valor = next((c for c in df.columns if 'valor' in c and 'pago' not in c), None)
    col_nome = next((c for c in df.columns if 'fornecedor' in c or 'cliente' in c), None)
    col_docto = next((c for c in df.columns if 'docto' in c or 'nf' in c), None)
    col_status = next((c for c in df.columns if 'status' in c), None)
    col_historico = next((c for c in df.columns if 'histórico' in c or 'historico' in c), None)
    
    col_baixa = next((c for c in df.columns if 'baixa' in c), None)
    col_valor_pago = next((c for c in df.columns if 'valor pago' in c), None)

    if not col_vencimento or not col_valor or not col_nome:
        raise HTTPException(status_code=400, detail="Arquivo não possui colunas obrigatórias (Vencimento, Valor, Cliente/Fornecedor).")

    # 3. Criar registro de Batch
    batch = ImportBatch(
        source_type="ERP_PAYABLE" if is_payable else "ERP_RECEIVABLE",
        company_id=company_id,
        file_hash=file_hash,
        status="SUCCESS",
        created_by=user_id
    )
    db.add(batch)
    db.flush() # Gerar ID do batch

    # 4. Iterar linhas e popular entidades
    min_date = None
    max_date = None

    for _, row in df.iterrows():
        # Valores básicos
        try:
            venc_ts = pd.to_datetime(row[col_vencimento], errors='coerce', dayfirst=True)
            if pd.isna(venc_ts): continue
            vencimento = venc_ts.date()

            valor = float(row[col_valor]) if not pd.isna(row[col_valor]) else 0.0
            nome = str(row[col_nome])
            docto = str(row[col_docto]) if col_docto and not pd.isna(row[col_docto]) else None
            status = str(row[col_status]).upper() if col_status and not pd.isna(row[col_status]) else 'ABERTO'

            venc_real = vencimento
            if col_venc_real and not pd.isna(row[col_venc_real]):
                venc_real_ts = pd.to_datetime(row[col_venc_real], errors='coerce', dayfirst=True)
                if not pd.isna(venc_real_ts):
                    venc_real = venc_real_ts.date()
                    
            historico = str(row[col_historico]) if col_historico and not pd.isna(row[col_historico]) else None
            
            # Controle de período do batch
            if not min_date or vencimento < min_date: min_date = vencimento
            if not max_date or vencimento > max_date: max_date = vencimento

            if is_payable:
                title = AccountPayable(
                    company_id=company_id,
                    batch_id=batch.id,
                    supplier_name=nome,
                    document_no=docto,
                    due_date=vencimento,
                    due_date_real=venc_real,
                    amount=valor,
                    status=status,
                    history=historico,
                    raw_data=_clean_raw_data(row)
                )
            else:
                title = AccountReceivable(
                    company_id=company_id,
                    batch_id=batch.id,
                    customer_name=nome,
                    document_no=docto,
                    due_date=vencimento,
                    due_date_real=venc_real,
                    amount=valor,
                    status=status,
                    history=historico,
                    raw_data=_clean_raw_data(row)
                )
            
            db.add(title)
            db.flush()

            # Checar se tem baixa associada na mesma linha do ERP
            if col_baixa and col_valor_pago:
                baixa_data_val = row[col_baixa]
                if not pd.isna(baixa_data_val):
                    baixa_ts = pd.to_datetime(baixa_data_val, errors='coerce', dayfirst=True)
                    if not pd.isna(baixa_ts):
                        baixa_data = baixa_ts.date()
                        valor_pago = float(row[col_valor_pago]) if not pd.isna(row[col_valor_pago]) else 0.0
                        
                        if valor_pago > 0:
                            settlement = TitleSettlement(
                                title_type="PAYABLE" if is_payable else "RECEIVABLE",
                                title_id=title.id,
                                settlement_date=baixa_data,
                                amount_paid=valor_pago,
                                source_batch_id=batch.id
                            )
                            db.add(settlement)

        except Exception as e:
            # Em prod, faríamos um log específico para linha, por hora rollback total ou skip
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Erro processando linha: {str(e)}")

    batch.period_start = min_date
    batch.period_end = max_date
    
    db.commit()
    
    return {
        "detail": "Importação concluída", 
        "batch_id": batch.id,
        "period_start": batch.period_start,
        "period_end": batch.period_end
    }
