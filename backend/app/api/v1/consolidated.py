from fastapi import APIRouter, Depends
from datetime import date

from app.api import deps
from app.services.consolidated_service import get_consolidated_flow

router = APIRouter()

@router.get("/")
def get_consolidated(db: deps.SessionDep, current_user: deps.CurrentUser, target_date: date):
    """
    Retorna a visão gerencial do fluxo de caixa: consolidado Bruto e Líquido (sem transferências internas).
    """
    return get_consolidated_flow(db, target_date)
