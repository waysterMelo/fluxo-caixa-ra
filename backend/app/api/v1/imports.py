from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Annotated

from app.api import deps
from app.services.erp_import_service import process_erp_import
from app.services.bank_import_service import process_bank_import

router = APIRouter()

@router.post("/erp/payable")
def import_erp_payable(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: Annotated[int, Form()], file: UploadFile = File(...)):
    """
    Importa contas a pagar (ERPFlex).
    """
    return process_erp_import(
        db=db, 
        file=file, 
        company_id=company_id, 
        user_id=current_user.id, 
        is_payable=True
    )

@router.post("/erp/receivable")
def import_erp_receivable(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: Annotated[int, Form()], file: UploadFile = File(...)):
    """
    Importa contas a receber (ERPFlex).
    """
    return process_erp_import(
        db=db, 
        file=file, 
        company_id=company_id, 
        user_id=current_user.id, 
        is_payable=False
    )

@router.post("/bank")
def import_bank(db: deps.SessionDep, current_user: deps.CurrentUser, company_id: Annotated[int, Form()], bank_account_id: Annotated[int, Form()], replace_period: Annotated[bool, Form()] = False, file: UploadFile = File(...)):
    """
    Importa extrato bancário. Se replace_period for verdadeiro e usuário não for admin, deve ser validado.
    """
    if replace_period and not current_user.is_admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Somente administrador pode forçar substituição de período.")
        
    return process_bank_import(
        db=db, 
        file=file, 
        company_id=company_id,
        bank_account_id=bank_account_id,
        user_id=current_user.id,
        replace_period=replace_period
    )
