from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class InternalTransfer(Base):
    __tablename__ = "internal_transfers"

    id = Column(Integer, primary_key=True, index=True)
    
    # O movimento de saída na empresa de origem
    movement_out_id = Column(Integer, ForeignKey("bank_movements.id"), nullable=False, index=True)
    company_from_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # O movimento de entrada na empresa de destino
    movement_in_id = Column(Integer, ForeignKey("bank_movements.id"), nullable=False, index=True)
    company_to_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    amount = Column(Numeric(15, 2), nullable=False)
    transfer_date = Column(Date, nullable=False, index=True)
    
    status = Column(String, nullable=False, default="SUGGESTED", index=True) # SUGGESTED, VALIDATED, REJECTED
    validated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    movement_out = relationship("BankMovement", foreign_keys=[movement_out_id])
    movement_in = relationship("BankMovement", foreign_keys=[movement_in_id])
    company_from = relationship("Company", foreign_keys=[company_from_id])
    company_to = relationship("Company", foreign_keys=[company_to_id])
    user = relationship("User")
