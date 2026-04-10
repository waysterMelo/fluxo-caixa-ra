from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException
from datetime import timedelta
import json

from app.models.bank_movement import BankMovement
from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.title_settlement import TitleSettlement
from app.models.reconciliation import Reconciliation
from app.models.audit_log import AuditLog

# Algoritmo de Score
# Valor Igual: 40 pontos
# Data (mesmo dia ou +/- 2 dias): 25 pontos
# Histórico/Nome similar: 15 pontos
# Documento compatível: 10 pontos
# Contexto compatível: 10 pontos
# Total: 100 pontos

def calculate_score(movement: BankMovement, title, is_settlement: bool = False) -> int:
    score = 0
    
    # 1. Valor (40)
    mov_amount = movement.credit_amount if movement.credit_amount > 0 else movement.debit_amount
    target_amount = title.amount_paid if is_settlement else title.amount
    
    if float(mov_amount) == float(target_amount):
        score += 40
    elif abs(float(mov_amount) - float(target_amount)) < 0.1: # Tolerância de centavos
        score += 35

    # 2. Data (25)
    target_date = title.settlement_date if is_settlement else (title.due_date_real or title.due_date)
    delta_days = abs((movement.movement_date - target_date).days)
    
    if delta_days == 0:
        score += 25
    elif delta_days <= 2:
        score += 15

    # 3. Histórico / Nome (15) - Simples checagem de substring cruzada (para produção usar biblioteca de NLP tipo fuzzywuzzy)
    target_text = ""
    if is_settlement:
        target_text = title.bank_label or ""
    else:
        name = title.supplier_name if hasattr(title, 'supplier_name') else title.customer_name
        history = title.history or ""
        target_text = f"{name} {history}".upper()
    
    mov_desc = movement.description_normalized
    if mov_desc and target_text:
        # Se 30% das palavras do menor texto estiverem no maior, damos os pontos. Implementação simplificada:
        words_mov = set(mov_desc.split())
        words_tgt = set(target_text.split())
        common = words_mov.intersection(words_tgt)
        if len(common) > 0:
            score += 15

    # 4. Documento (10)
    if not is_settlement:
        if movement.document_no and title.document_no and movement.document_no in title.document_no:
            score += 10

    # 5. Contexto (10) - Tipo de movimento VS tipo de título
    is_credit = movement.credit_amount > 0
    if is_settlement:
        if (is_credit and title.title_type == 'RECEIVABLE') or (not is_credit and title.title_type == 'PAYABLE'):
            score += 10
    else:
        if (is_credit and isinstance(title, AccountReceivable)) or (not is_credit and isinstance(title, AccountPayable)):
            score += 10

    return score


def auto_run_reconciliation(db: Session, company_id: int):
    # Pega movimentos ainda não conciliados
    conciliated_mov_ids = [r.movement_id for r in db.query(Reconciliation.movement_id).filter(Reconciliation.status == 'CONCILIATED')]
    
    pending_movements = db.query(BankMovement).filter(
        BankMovement.company_id == company_id,
        BankMovement.id.notin_(conciliated_mov_ids)
    ).all()

    # Pega títulos e baixas abertas da empresa
    payables = db.query(AccountPayable).filter(AccountPayable.company_id == company_id, AccountPayable.status != 'CONCILIATED').all()
    receivables = db.query(AccountReceivable).filter(AccountReceivable.company_id == company_id, AccountReceivable.status != 'CONCILIATED').all()
    settlements = db.query(TitleSettlement).filter(
        TitleSettlement.source_batch_id.in_(
            db.query(ImportBatch.id).filter(ImportBatch.company_id == company_id)
        )
    ).all() # Simplificação: Precisaria checar se o settlement já foi conciliado.

    results = {"suggested": 0, "conciliated": 0}

    for mov in pending_movements:
        best_match = None
        best_score = 0
        best_type = None

        targets = [
            (payables, 'PAYABLE', False),
            (receivables, 'RECEIVABLE', False),
            (settlements, 'SETTLEMENT', True)
        ]

        for target_list, t_type, is_set in targets:
            for t in target_list:
                score = calculate_score(mov, t, is_set)
                if score > best_score:
                    best_score = score
                    best_match = t
                    best_type = t_type

        if best_match and best_score >= 50:
            status = 'CONCILIATED' if best_score >= 90 else 'SUGGESTED'
            
            # Checar se já existe sugestão
            existing_rec = db.query(Reconciliation).filter(
                Reconciliation.movement_id == mov.id,
                Reconciliation.target_id == best_match.id,
                Reconciliation.target_type == best_type
            ).first()

            if not existing_rec:
                rec = Reconciliation(
                    movement_id=mov.id,
                    target_type=best_type,
                    target_id=best_match.id,
                    score=best_score,
                    status=status,
                    reason_code=f"AUTO_MATCH_{best_score}"
                )
                db.add(rec)
                
                if status == 'CONCILIATED':
                    results["conciliated"] += 1
                    # Atualizar status do título se for conciliação direta (simplificado)
                    if best_type in ['PAYABLE', 'RECEIVABLE']:
                        best_match.status = 'CONCILIATED'
                else:
                    results["suggested"] += 1
                    
    db.commit()
    return results

def manual_link(db: Session, movement_id: int, target_type: str, target_id: int, user_id: int):
    # Verificar movimento
    mov = db.query(BankMovement).filter(BankMovement.id == movement_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimento não encontrado")

    # Auditar ação
    audit = AuditLog(
        entity_name="Reconciliation",
        entity_id=movement_id,
        action="MANUAL_LINK",
        before_json={"status": "UNCONCILIATED"},
        after_json={"target_type": target_type, "target_id": target_id, "status": "CONCILIATED"},
        user_id=user_id
    )
    db.add(audit)

    # Deletar sugestões anteriores
    db.query(Reconciliation).filter(Reconciliation.movement_id == movement_id).delete()

    # Criar vínculo manual
    rec = Reconciliation(
        movement_id=movement_id,
        target_type=target_type,
        target_id=target_id,
        score=100, # Manual é certeza absoluta do usuário
        status="CONCILIATED",
        reason_code="MANUAL_LINK",
        created_by=user_id
    )
    db.add(rec)
    
    # Atualizar o título alvo (opcional mas recomendado)
    if target_type == 'PAYABLE':
        db.query(AccountPayable).filter(AccountPayable.id == target_id).update({"status": "CONCILIATED"})
    elif target_type == 'RECEIVABLE':
        db.query(AccountReceivable).filter(AccountReceivable.id == target_id).update({"status": "CONCILIATED"})

    db.commit()
    return {"detail": "Vínculo manual realizado com sucesso"}
