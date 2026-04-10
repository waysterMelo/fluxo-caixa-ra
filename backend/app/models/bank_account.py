from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    bank_code = Column(String, nullable=False)
    bank_name = Column(String, nullable=False)
    agency = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    company = relationship("Company", backref="bank_accounts")
