from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class Reconciliation(Base):
    __tablename__ = "reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    movement_id = Column(Integer, ForeignKey("bank_movements.id"), nullable=False, index=True)
    
    # Pode conciliar com um AccountPayable/Receivable diretamente ou com uma Baixa (TitleSettlement)
    # Vamos manter flexível usando type e id.
    target_type = Column(String, nullable=True, index=True) # PAYABLE, RECEIVABLE, SETTLEMENT, ADJUSTMENT
    target_id = Column(Integer, nullable=True, index=True)
    
    score = Column(Integer, nullable=False, default=0) # 0 a 100
    status = Column(String, nullable=False, index=True) # SUGGESTED, CONCILIATED, REJECTED
    reason_code = Column(String, nullable=True) # Ex: AUTO_MATCH_100, MANUAL_LINK
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True) # Null se automático
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    movement = relationship("BankMovement")
    user = relationship("User")
