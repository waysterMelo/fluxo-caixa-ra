from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from pydantic import BaseModel

from app.api import deps
from app.models.manual_adjustment import ManualAdjustment
from app.models.audit_log import AuditLog
from app.models.daily_closing import DailyClosing

router = APIRouter()

class AdjustmentCreate(BaseModel):
    company_id: int
    adjustment_date: date
    kind: str # IN ou OUT
    amount: float
    description: str
    category_id: str = None
    reason: str # Obrigatório pela arquitetura

@router.post("/")
def create_adjustment(db: deps.SessionDep, current_user: deps.CurrentUser, req: AdjustmentCreate):
    """Cria um ajuste formal manual (com trilha de auditoria). Bloqueado se dia fechado."""
    # Valida se o dia já não está fechado
    closed = db.query(DailyClosing).filter(
        DailyClosing.company_id == req.company_id,
        DailyClosing.closing_date == req.adjustment_date,
        DailyClosing.status == 'CLOSED'
    ).first()
    
    if closed:
        raise HTTPException(status_code=400, detail="Não é possível lançar ajustes em um dia fechado.")

    adj = ManualAdjustment(
        company_id=req.company_id,
        adjustment_date=req.adjustment_date,
        kind=req.kind,
        amount=req.amount,
        description=req.description,
        category_id=req.category_id,
        reason=req.reason,
        created_by=current_user.id
    )
    db.add(adj)
    db.flush()

    audit = AuditLog(
        entity_name="ManualAdjustment",
        entity_id=adj.id,
        action="INSERT",
        after_json={"amount": req.amount, "kind": req.kind, "reason": req.reason},
        user_id=current_user.id
    )
    db.add(audit)
    
    db.commit()
    return {"detail": "Ajuste criado com sucesso", "id": adj.id}
