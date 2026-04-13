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

    movements = []
    
    initial_balance_adj = db.query(ManualAdjustment).filter(
        ManualAdjustment.company_id == company_id,
        ManualAdjustment.reason == 'Registro de Saldo Inicial'
    ).order_by(ManualAdjustment.adjustment_date.asc()).first()
    
    initial_balance_info = None
    if initial_balance_adj:
        initial_balance_info = {
            "amount": float(initial_balance_adj.amount),
            "date": initial_balance_adj.adjustment_date.isoformat()
        }

    # 2. Entradas e Saídas Planejadas (Títulos não baixados/conciliados até a data)
    # Na prática, num fluxo diário, "planejado" no dia corrente seria o que vence hoje e não foi pago.
    ars = db.query(AccountReceivable).filter(
        AccountReceivable.company_id == company_id
    ).all()
    planned_in = 0.0
    for ar in ars:
        if ar.status != 'CONCILIATED':
            planned_in += float(ar.amount)
        status_mov = "PREVISTO" if ar.status not in ['RECEBIDO', 'CONCILIATED'] else "REALIZADO"
        movements.append({
            "id": f"AR-{ar.id}",
            "data": ar.due_date.isoformat(),
            "descricao": ar.history or f"Recebimento de {ar.customer_name}",
            "categoria": "Contas a Receber",
            "tipo": "ENTRADA",
            "valor": float(ar.amount),
            "status": status_mov
        })

    aps = db.query(AccountPayable).filter(
        AccountPayable.company_id == company_id
    ).all()
    planned_out = 0.0
    for ap in aps:
        if ap.status != 'CONCILIATED':
            planned_out += float(ap.amount)
        status_mov = "PREVISTO" if ap.status not in ['PAGO', 'CONCILIATED'] else "REALIZADO"
        movements.append({
            "id": f"AP-{ap.id}",
            "data": ap.due_date.isoformat(),
            "descricao": ap.history or f"Pagamento a {ap.supplier_name}",
            "categoria": "Contas a Pagar",
            "tipo": "SAIDA",
            "valor": float(ap.amount),
            "status": status_mov
        })

    # 3. Entradas e Saídas Realizadas (Banco + Ajustes)
    bank_movs = db.query(BankMovement).filter(
        BankMovement.company_id == company_id
    ).all()
    bank_in = 0.0
    bank_out = 0.0
    for bm in bank_movs:
        if bm.credit_amount and float(bm.credit_amount) > 0:
            bank_in += float(bm.credit_amount)
            movements.append({
                "id": f"BM-{bm.id}",
                "data": bm.movement_date.isoformat(),
                "descricao": bm.history,
                "categoria": "Banco",
                "tipo": "ENTRADA",
                "valor": float(bm.credit_amount),
                "status": "REALIZADO"
            })
        if bm.debit_amount and float(bm.debit_amount) > 0:
            bank_out += float(bm.debit_amount)
            movements.append({
                "id": f"BM-{bm.id}",
                "data": bm.movement_date.isoformat(),
                "descricao": bm.history,
                "categoria": "Banco",
                "tipo": "SAIDA",
                "valor": float(bm.debit_amount),
                "status": "REALIZADO"
            })

    adjs = db.query(ManualAdjustment).filter(
        ManualAdjustment.company_id == company_id
    ).all()
    adj_in = 0.0
    adj_out = 0.0
    for adj in adjs:
        if adj.kind == 'IN':
            adj_in += float(adj.amount)
            movements.append({
                "id": f"ADJ-{adj.id}",
                "data": adj.adjustment_date.isoformat(),
                "descricao": adj.reason,
                "categoria": "Ajuste Manual",
                "tipo": "ENTRADA",
                "valor": float(adj.amount),
                "status": "REALIZADO"
            })
        else:
            adj_out += float(adj.amount)
            movements.append({
                "id": f"ADJ-{adj.id}",
                "data": adj.adjustment_date.isoformat(),
                "descricao": adj.reason,
                "categoria": "Ajuste Manual",
                "tipo": "SAIDA",
                "valor": float(adj.amount),
                "status": "REALIZADO"
            })

    realized_in = bank_in + adj_in
    realized_out = bank_out + adj_out

    # 4. Cálculo de Saldos
    flow_balance = opening_balance + realized_in - realized_out
    
    # Saldo bancário é a soma do balance_after do extrato ou fluxo. 
    # (Simplificação: pegando o último registro do dia pelo ID, idealmente ordenar por tempo/ordem original)
    last_bank_mov = db.query(BankMovement).filter(
        BankMovement.company_id == company_id,
        BankMovement.movement_date == target_date
    ).order_by(BankMovement.id.desc()).first()
    
    bank_balance = float(last_bank_mov.balance_after) if last_bank_mov and last_bank_mov.balance_after is not None else 0.0

    # Ordenar movimentos por data, depois por tipo (entradas antes de saídas), depois por valor
    movements.sort(key=lambda x: (x["data"], x["tipo"], -x["valor"]))

    return {
        "company_id": company_id,
        "date": target_date.isoformat(),
        "opening_balance": opening_balance,
        "planned_in": planned_in,
        "planned_out": planned_out,
        "realized_in": realized_in,
        "realized_out": realized_out,
        "flow_balance": flow_balance,
        "bank_balance": bank_balance,
        "difference": flow_balance - bank_balance,
        "movements": movements,
        "initial_balance_info": initial_balance_info
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
