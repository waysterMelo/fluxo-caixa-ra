from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from fastapi import HTTPException

from app.models.company import Company
from app.models.bank_movement import BankMovement
from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.manual_adjustment import ManualAdjustment
from app.models.daily_closing import DailyClosing
from app.models.audit_log import AuditLog

def get_company_flow(db: Session, company_id: int, target_date: date):
    # 1. Obter o saldo de abertura (do fechamento do dia anterior)
    last_closing = db.query(DailyClosing).filter(
        DailyClosing.company_id == company_id,
        DailyClosing.closing_date < target_date,
        DailyClosing.status == 'CLOSED'
    ).order_by(DailyClosing.closing_date.desc()).first()
    
    opening_balance = float(last_closing.flow_balance) if last_closing else 0.0

    # 2. Entradas e Saídas Planejadas (Títulos não baixados/conciliados até a data)
    # Na prática, num fluxo diário, "planejado" no dia corrente seria o que vence hoje e não foi pago.
    planned_in = db.query(func.sum(AccountReceivable.amount)).filter(
        AccountReceivable.company_id == company_id,
        AccountReceivable.due_date == target_date,
        AccountReceivable.status != 'CONCILIATED'
    ).scalar() or 0.0

    planned_out = db.query(func.sum(AccountPayable.amount)).filter(
        AccountPayable.company_id == company_id,
        AccountPayable.due_date == target_date,
        AccountPayable.status != 'CONCILIATED'
    ).scalar() or 0.0

    # 3. Entradas e Saídas Realizadas (Banco + Ajustes)
    bank_in = db.query(func.sum(BankMovement.credit_amount)).filter(
        BankMovement.company_id == company_id,
        BankMovement.movement_date == target_date
    ).scalar() or 0.0
    
    bank_out = db.query(func.sum(BankMovement.debit_amount)).filter(
        BankMovement.company_id == company_id,
        BankMovement.movement_date == target_date
    ).scalar() or 0.0

    adj_in = db.query(func.sum(ManualAdjustment.amount)).filter(
        ManualAdjustment.company_id == company_id,
        ManualAdjustment.adjustment_date == target_date,
        ManualAdjustment.kind == 'IN'
    ).scalar() or 0.0
    
    adj_out = db.query(func.sum(ManualAdjustment.amount)).filter(
        ManualAdjustment.company_id == company_id,
        ManualAdjustment.adjustment_date == target_date,
        ManualAdjustment.kind == 'OUT'
    ).scalar() or 0.0

    realized_in = float(bank_in) + float(adj_in)
    realized_out = float(bank_out) + float(adj_out)

    # 4. Cálculo de Saldos
    flow_balance = opening_balance + realized_in - realized_out
    
    # Saldo bancário é a soma do balance_after do extrato ou fluxo. 
    # (Simplificação: pegando o último registro do dia pelo ID, idealmente ordenar por tempo/ordem original)
    last_bank_mov = db.query(BankMovement).filter(
        BankMovement.company_id == company_id,
        BankMovement.movement_date == target_date
    ).order_by(BankMovement.id.desc()).first()
    
    bank_balance = float(last_bank_mov.balance_after) if last_bank_mov and last_bank_mov.balance_after is not None else 0.0

    return {
        "company_id": company_id,
        "date": target_date,
        "opening_balance": opening_balance,
        "planned_in": float(planned_in),
        "planned_out": float(planned_out),
        "realized_in": realized_in,
        "realized_out": realized_out,
        "flow_balance": flow_balance,
        "bank_balance": bank_balance,
        "difference": flow_balance - bank_balance
    }

def close_day(db: Session, company_id: int, target_date: date, user_id: int, notes: str = None):
    # Verifica se já está fechado
    existing = db.query(DailyClosing).filter(
        DailyClosing.company_id == company_id, 
        DailyClosing.closing_date == target_date,
        DailyClosing.status == 'CLOSED'
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Dia já está fechado para esta empresa.")

    # Calcular fluxo do dia
    flow_data = get_company_flow(db, company_id, target_date)
    
    # Tolerância de pendências (pela especificação, permitimos fechar com notas, o admin pode revisar depois)
    closing = DailyClosing(
        company_id=company_id,
        closing_date=target_date,
        flow_balance=flow_data['flow_balance'],
        bank_balance=flow_data['bank_balance'],
        difference_amount=flow_data['difference'],
        notes=notes,
        closed_by=user_id,
        status="CLOSED"
    )
    db.add(closing)
    
    # Auditar fechamento
    audit = AuditLog(
        entity_name="DailyClosing",
        entity_id=company_id,
        action="CLOSE_DAY",
        after_json={"date": str(target_date), "flow_balance": flow_data['flow_balance']},
        user_id=user_id
    )
    db.add(audit)
    
    db.commit()
    return {"detail": "Dia fechado com sucesso.", "closing_id": closing.id}

def reopen_day(db: Session, company_id: int, target_date: date, user_id: int, reason: str):
    # Verifica se está fechado
    existing = db.query(DailyClosing).filter(
        DailyClosing.company_id == company_id, 
        DailyClosing.closing_date == target_date,
        DailyClosing.status == 'CLOSED'
    ).first()
    
    if not existing:
        raise HTTPException(status_code=400, detail="Dia não está fechado para esta empresa na data informada.")

    # Auditar reabertura antes de mudar o estado
    audit = AuditLog(
        entity_name="DailyClosing",
        entity_id=company_id,
        action="REOPEN_DAY",
        before_json={"date": str(target_date), "status": "CLOSED"},
        after_json={"status": "REOPENED", "reason": reason},
        user_id=user_id
    )
    db.add(audit)

    # Marca como reaberto preservando o registro
    existing.status = 'REOPENED'
    existing.reopened_by = user_id
    existing.reopened_at = func.now()
    existing.reopen_reason = reason
    
    db.commit()
    return {"detail": "Dia reaberto com sucesso. Operação auditada."}
