from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class BankMovement(Base):
    __tablename__ = "bank_movements"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    
    movement_date = Column(Date, nullable=False, index=True)
    description_raw = Column(String, nullable=False)
    description_normalized = Column(String, nullable=False, index=True)
    document_no = Column(String, nullable=True, index=True)
    
    credit_amount = Column(Numeric(15, 2), nullable=False, default=0.0)
    debit_amount = Column(Numeric(15, 2), nullable=False, default=0.0)
    balance_after = Column(Numeric(15, 2), nullable=True) # Saldo da linha no extrato
    
    dedup_key = Column(String, unique=True, index=True, nullable=False) # chave única: conta+data+tipo+valor+documento+descrição
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company")
    bank_account = relationship("BankAccount")
    batch = relationship("ImportBatch")
