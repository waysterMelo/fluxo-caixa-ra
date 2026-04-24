import pandas as pd
import hashlib
import re
import unicodedata
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import UploadFile, HTTPException

from app.models.import_batch import ImportBatch
from app.models.bank_movement import BankMovement
from app.models.company import Company
from app.models.bank_account import BankAccount

def calculate_file_hash(file_contents: bytes) -> str:
    return hashlib.sha256(file_contents).hexdigest()

def normalize_string(text: str) -> str:
    if pd.isna(text): return ""
    return str(text).strip().upper()

def normalize_column_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value).strip().lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text)

def parse_money(value: object) -> float:
    if pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return 0.0

    is_negative = text.startswith("(") and text.endswith(")")
    text = text.replace("R$", "").replace("\u00a0", "").strip("() ")
    text = re.sub(r"[^0-9,.\-]", "", text)

    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")

    amount = float(text) if text else 0.0
    return -abs(amount) if is_negative else amount

def process_bank_import(
    db: Session, 
    file: UploadFile, 
    company_id: int, 
    bank_account_id: int,
    user_id: int,
    replace_period: bool = False
):
    # 1. Validar Empresa e Conta
    company = db.query(Company).filter(Company.id == company_id).first()
    account = db.query(BankAccount).filter(BankAccount.id == bank_account_id, BankAccount.company_id == company_id).first()
    
    if not company or not account:
        raise HTTPException(status_code=404, detail="Empresa ou Conta Bancária não encontrada.")

    # 2. Ler e processar o arquivo (apenas memória)
    contents = file.file.read()
    file_hash = calculate_file_hash(contents)
    
    # Prevenir duplicidade do lote inteiro (DESABILITADO conforme solicitação)
    # existing_batch = db.query(ImportBatch).filter(ImportBatch.file_hash == file_hash).first()
    # if existing_batch and not replace_period:
    #     raise HTTPException(status_code=400, detail="Arquivo já importado anteriormente.")

    # Ler arquivo
    try:
        import io
        filename_lower = file.filename.lower()
        if filename_lower.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename_lower.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename_lower.endswith('.pdf'):
            import pdfplumber
            import tempfile
            
            # Write bytes to a temp file for pdfplumber
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(contents)
                tmp_path = tmp.name
                
            all_text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text + "\n"
            
            import os
            os.remove(tmp_path)
            
            # Extremely basic parsing of PDF text into DataFrame assuming standard bank statement layout
            # For a real-world scenario, this needs complex regex parsing per bank.
            # Here we try to find lines that look like: DD/MM/YYYY Description Value
            import re
            lines = all_text.split('\n')
            parsed_data = []
            
            # Generic regex for DD/MM/YYYY or DD/MM
            date_pattern = re.compile(r'^(\d{2}/\d{2}(?:/\d{4})?)')
            
            for line in lines:
                match = date_pattern.search(line)
                if match:
                    date_str = match.group(1)
                    rest_of_line = line[match.end():].strip()
                    
                    # Try to extract the last number as value
                    value_match = re.search(r'(-?[\d\.]+,\d{2})\s*$', rest_of_line)
                    if value_match:
                        value_str = value_match.group(1)
                        desc = rest_of_line[:value_match.start()].strip()
                        
                        # Standardize value string to float
                        val_float = parse_money(value_str)
                        
                        parsed_data.append({
                            'data': date_str,
                            'descrição': desc,
                            'valor_bruto': val_float
                        })
            
            if not parsed_data:
                 raise HTTPException(status_code=400, detail="Não foi possível extrair dados estruturados deste PDF.")
                 
            df = pd.DataFrame(parsed_data)
            # Create artificial debito/credito columns to match expected schema
            df['crédito'] = df['valor_bruto'].apply(lambda x: x if x > 0 else 0)
            df['débito'] = df['valor_bruto'].apply(lambda x: abs(x) if x < 0 else 0)
            
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use PDF, CSV ou XLSX.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {str(e)}")

    df.columns = [normalize_column_name(c) for c in df.columns]

    # Mapas de colunas esperadas (Baseado no doc: Data, Lançamento/Descrição, Dcto, Crédito, Débito, Saldo)
    col_data = next((c for c in df.columns if 'data' in c), None)
    col_desc = next((c for c in df.columns if 'lançamento' in c or 'historico' in c or 'histórico' in c or 'descrição' in c), None)
    col_docto = next((c for c in df.columns if 'dcto' in c or 'documento' in c), None)
    col_credito = next((c for c in df.columns if 'crédito' in c or 'credito' in c or 'entrada' in c), None)
    col_debito = next((c for c in df.columns if 'débito' in c or 'debito' in c or 'saída' in c or 'saida' in c), None)
    col_saldo = next((c for c in df.columns if 'saldo' in c), None)

    if not col_desc:
        col_desc = next((c for c in df.columns if 'descri' in c or 'lanc' in c or 'hist' in c), None)
    if not col_credito:
        col_credito = next((c for c in df.columns if 'credit' in c or 'entrada' in c or (c.startswith('cr') and 'dito' in c)), None)
    if not col_debito:
        col_debito = next((c for c in df.columns if 'debit' in c or 'saida' in c or (c.startswith('d') and 'bito' in c)), None)

    if not col_data or not col_desc or (not col_credito and not col_debito):
        raise HTTPException(status_code=400, detail="Arquivo bancário não possui colunas obrigatórias (Data, Descrição, Crédito/Débito).")

    # Ignorar "Últimos Lançamentos" se existir (regra da especificação)
    # Procuramos o índice da linha que contém "últimos lançamentos" e cortamos o dataframe ali.
    ultimos_lancamentos_idx = df[df[col_desc].astype(str).str.contains('últimos lançamentos|ultimos lancamentos', case=False, na=False)].index
    if not ultimos_lancamentos_idx.empty:
        df = df.iloc[:ultimos_lancamentos_idx[0]]

    # 3. Criar registro de Batch
    batch = ImportBatch(
        source_type="BANK_STATEMENT",
        company_id=company_id,
        bank_account_id=bank_account_id,
        file_hash=file_hash,
        status="SUCCESS",
        created_by=user_id
    )
    db.add(batch)
    db.flush()

    min_date = None
    max_date = None
    inserted_count = 0
    duplicate_count = 0

    for _, row in df.iterrows():
        try:
            data_ts = pd.to_datetime(row[col_data], dayfirst=True, errors='coerce')
            if pd.isna(data_ts): continue
            data_movimento = data_ts.date()
            
            desc_raw = str(row[col_desc]) if not pd.isna(row[col_desc]) else ""
            desc_norm = normalize_string(desc_raw)
            docto = str(row[col_docto]) if col_docto and not pd.isna(row[col_docto]) else None
            
            credito = abs(parse_money(row[col_credito])) if col_credito and not pd.isna(row[col_credito]) else 0.0
            debito = abs(parse_money(row[col_debito])) if col_debito and not pd.isna(row[col_debito]) else 0.0
            saldo = parse_money(row[col_saldo]) if col_saldo and not pd.isna(row[col_saldo]) else None

            # Não processar linha se for puramente vazia de valores
            if credito == 0 and debito == 0:
                continue
                
            if not min_date or data_movimento < min_date: min_date = data_movimento
            if not max_date or data_movimento > max_date: max_date = data_movimento

            tipo = "C" if credito > 0 else "D"
            valor = credito if credito > 0 else debito

            # Geração da Chave de Deduplicação (conta + data + tipo + valor + documento + descrição)
            # Para evitar erro se o docto for vazio, usamos uma string fixa
            docto_chave = docto if docto else "NODOC"
            dedup_string = f"{bank_account_id}_{data_movimento}_{tipo}_{valor:.2f}_{docto_chave}_{desc_norm}"
            dedup_key = hashlib.md5(dedup_string.encode('utf-8')).hexdigest()

            movement = BankMovement(
                company_id=company_id,
                bank_account_id=bank_account_id,
                batch_id=batch.id,
                movement_date=data_movimento,
                description_raw=desc_raw,
                description_normalized=desc_norm,
                document_no=docto,
                credit_amount=credito,
                debit_amount=debito,
                balance_after=saldo,
                dedup_key=dedup_key
            )
            
            db.add(movement)
            try:
                db.flush()
                inserted_count += 1
            except IntegrityError:
                db.rollback()
                duplicate_count += 1
                # Se for substituição de período e for duplicado, o ideal seria apagar o período primeiro.
                # Como a regra pede "merge inteligente", nós preservamos os conhecidos e inserimos apenas novos.
                
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Erro processando linha de extrato: {str(e)}")

    batch.period_start = min_date
    batch.period_end = max_date
    db.commit()
    
    return {
        "detail": "Importação de extrato concluída", 
        "batch_id": batch.id,
        "period_start": batch.period_start,
        "period_end": batch.period_end,
        "inserted": inserted_count,
        "duplicates_ignored": duplicate_count
    }
