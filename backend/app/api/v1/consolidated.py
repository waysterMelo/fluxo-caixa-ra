from fastapi import APIRouter, Depends
from datetime import date
from typing import Optional

from app.api import deps
from app.services.consolidated_service import get_consolidated_daily_projection, get_consolidated_flow

router = APIRouter()

@router.get("/daily")
def get_consolidated_daily(db: deps.SessionDep, current_user: deps.CurrentUser, start_date: Optional[date] = None, end_date: Optional[date] = None):
    """
    Retorna a projeção diária consolidada por empresa, baseada em contas ERP.
    """
    return get_consolidated_daily_projection(db, start_date, end_date)

@router.get("/")
def get_consolidated(db: deps.SessionDep, current_user: deps.CurrentUser, target_date: date):
    """
    Retorna a visão gerencial do fluxo de caixa: consolidado Bruto e Líquido (sem transferências internas).
    """
    return get_consolidated_flow(db, target_date)
