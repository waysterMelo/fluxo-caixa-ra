from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from pydantic import BaseModel
from typing import Optional

from app.api import deps
from app.services.flow_service import get_company_flow, close_day, reopen_day
from app.models.account_receivable import AccountReceivable
from app.models.account_payable import AccountPayable
from app.models.bank_movement import BankMovement
from app.models.manual_adjustment import ManualAdjustment

router = APIRouter()

class CloseDayRequest(BaseModel):
    notes: Optional[str] = None

class ReopenDayRequest(BaseModel):
    reason: str

@router.delete("/movement/{movement_id}")
def delete_movement(db: deps.SessionDep, current_user: deps.CurrentUser, movement_id: str):
    """Deleta um movimento específico com base no seu prefixo ID (ex: AR-1, AP-2, BM-3, ADJ-4)."""
    try:
        prefix, _id_str = movement_id.split('-')
        _id = int(_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de ID de movimento inválido.")
        
    obj = None
    if prefix == 'AR':
        obj = db.query(AccountReceivable).filter(AccountReceivable.id == _id).first()
    elif prefix == 'AP':
        obj = db.query(AccountPayable).filter(AccountPayable.id == _id).first()
    elif prefix == 'BM':
        obj = db.query(BankMovement).filter(BankMovement.id == _id).first()
    elif prefix == 'ADJ':
        obj = db.query(ManualAdjustment).filter(ManualAdjustment.id == _id).first()
    else:
        raise HTTPException(status_code=400, detail="Tipo de movimento inválido")
    
    if not obj:
        raise HTTPException(status_code=404, detail="Movimento não encontrado")
        
    db.delete(obj)
    db.commit()
    return {"detail": "Movimento deletado com sucesso"}

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
