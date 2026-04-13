from pydantic import BaseModel
from typing import Optional

class BankAccountBase(BaseModel):
    bank_code: str
    bank_name: str
    agency: str
    account_number: str
    is_active: Optional[bool] = True

class BankAccountCreate(BankAccountBase):
    company_id: int

class BankAccountUpdate(BankAccountBase):
    bank_code: Optional[str] = None
    bank_name: Optional[str] = None
    agency: Optional[str] = None
    account_number: Optional[str] = None
    company_id: Optional[int] = None
    is_active: Optional[bool] = None

class BankAccountInDBBase(BankAccountBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True

class BankAccount(BankAccountInDBBase):
    pass
