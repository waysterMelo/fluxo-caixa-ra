from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, nullable=False, index=True) # ERP_PAYABLE, ERP_RECEIVABLE, BANK_STATEMENT
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True) # Nullable for ERP imports usually
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    file_hash = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="PROCESSING") # PROCESSING, SUCCESS, FAILED, REPLACED
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company")
    bank_account = relationship("BankAccount")
    user = relationship("User")
