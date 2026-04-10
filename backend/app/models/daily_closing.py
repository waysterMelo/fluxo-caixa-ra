from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class DailyClosing(Base):
    __tablename__ = "daily_closings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    closing_date = Column(Date, nullable=False, index=True)
    
    flow_balance = Column(Numeric(15, 2), nullable=False) # Saldo calculado pelo sistema (Anterior + Entradas - Saídas)
    bank_balance = Column(Numeric(15, 2), nullable=False) # Saldo real do banco no fim do dia
    difference_amount = Column(Numeric(15, 2), nullable=False) # Diferença entre fluxo e banco
    
    status = Column(String, nullable=False, default="CLOSED") # CLOSED, REOPENED
    notes = Column(String, nullable=True) # Observações do fechamento
    
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    closed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Se reaberto
    reopened_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reopened_at = Column(DateTime(timezone=True), nullable=True)
    reopen_reason = Column(String, nullable=True)

    company = relationship("Company")
    user_closed = relationship("User", foreign_keys=[closed_by])
    user_reopened = relationship("User", foreign_keys=[reopened_by])
