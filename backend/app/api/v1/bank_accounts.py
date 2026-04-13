from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.bank_account import BankAccount
from app.schemas.bank_account import BankAccount as BankAccountSchema, BankAccountCreate, BankAccountUpdate

router = APIRouter()

@router.get("/", response_model=List[BankAccountSchema])
def read_bank_accounts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: int = None
):
    query = db.query(BankAccount)
    if company_id:
        query = query.filter(BankAccount.company_id == company_id)
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=BankAccountSchema, status_code=status.HTTP_201_CREATED)
def create_bank_account(
    *,
    db: Session = Depends(deps.get_db),
    bank_account_in: BankAccountCreate
):
    db_obj = BankAccount(
        company_id=bank_account_in.company_id,
        bank_code=bank_account_in.bank_code,
        bank_name=bank_account_in.bank_name,
        agency=bank_account_in.agency,
        account_number=bank_account_in.account_number,
        is_active=bank_account_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=BankAccountSchema)
def update_bank_account(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    bank_account_in: BankAccountUpdate
):
    db_obj = db.query(BankAccount).filter(BankAccount.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    update_data = bank_account_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=BankAccountSchema)
def delete_bank_account(
    *,
    db: Session = Depends(deps.get_db),
    id: int
):
    db_obj = db.query(BankAccount).filter(BankAccount.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Bank account not found")
    db.delete(db_obj)
    db.commit()
    return db_obj
