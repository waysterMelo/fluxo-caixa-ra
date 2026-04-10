from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from pydantic import BaseModel

from app.api import deps
from app.services.reconciliation_service import auto_run_reconciliation, manual_link

router = APIRouter()

class AutoRunRequest(BaseModel):
    company_id: int

class ManualLinkRequest(BaseModel):
    movement_id: int
    target_type: str # PAYABLE, RECEIVABLE, SETTLEMENT
    target_id: int

@router.post("/auto-run")
def run_auto_reconciliation(db: deps.SessionDep, current_user: deps.CurrentUser, req: AutoRunRequest):
    """
    Dispara o motor de conciliação automática para uma empresa.
    """
    results = auto_run_reconciliation(db, req.company_id)
    return {"detail": "Motor executado", "results": results}

@router.post("/manual-link")
def create_manual_link(db: deps.SessionDep, current_user: deps.CurrentUser, req: ManualLinkRequest):
    """
    Executa um vínculo manual entre um movimento bancário e um título.
    """
    # Todos podem fazer
    return manual_link(db, req.movement_id, req.target_type, req.target_id, current_user.id)

@router.get("/")
def list_reconciliations(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: int):
    """
    Lista pendências, sugestões e conciliações (Mocked data shape for now).
    """
    # Em produção isso faria um JOIN complexo, aqui retornamos uma estrutura base para o Frontend.
    from app.models.reconciliation import Reconciliation
    from sqlalchemy.orm import joinedload
    
    recs = db.query(Reconciliation).options(joinedload(Reconciliation.movement)).limit(100).all()
    return {"data": recs}
