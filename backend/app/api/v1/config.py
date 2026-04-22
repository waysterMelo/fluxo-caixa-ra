from datetime import date
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.services.config_service import config_service
from app.models.user import User

router = APIRouter()

@router.post("/cleanup-period")
def cleanup_period(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int = Body(...),
    start_date: date = Body(...),
    end_date: date = Body(...),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Apaga todas as movimentações de uma empresa em um período específico.
    Apenas administradores podem realizar esta operação.
    """
    return config_service.cleanup_period(
        db=db,
        company_id=company_id,
        start_date=start_date,
        end_date=end_date
    )
