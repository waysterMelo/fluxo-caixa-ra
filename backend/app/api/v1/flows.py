from fastapi import APIRouter, Depends
from datetime import date
from pydantic import BaseModel
from typing import Optional

from app.api import deps
from app.services.flow_service import get_company_flow, close_day, reopen_day

router = APIRouter()

class CloseDayRequest(BaseModel):
    notes: Optional[str] = None

class ReopenDayRequest(BaseModel):
    reason: str

@router.get("/{company_id}")
def get_flow(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: int, target_date: date):
    """Retorna o fluxo de caixa diário de uma empresa (Aberto ou Fechado)."""
    return get_company_flow(db, company_id, target_date)

@router.post("/{company_id}/{target_date}")
def execute_close_day(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: int, target_date: date, req: CloseDayRequest):
    """Congela o dia, registrando saldos."""
    return close_day(db, company_id, target_date, current_user.id, req.notes)

@router.post("/{company_id}/{target_date}/reopen")
def execute_reopen_day(db: deps.SessionDep, current_user: deps.AdminUser, company_id: int, target_date: date, req: ReopenDayRequest):
    """Reabre o dia. Apenas perfis Administradores."""
    # EXIGÊNCIA: Apenas Admin
    return reopen_day(db, company_id, target_date, current_user.id, req.reason)
