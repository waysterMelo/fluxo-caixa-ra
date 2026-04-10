from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class ManualAdjustment(Base):
    __tablename__ = "manual_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    adjustment_date = Column(Date, nullable=False, index=True)
    kind = Column(String, nullable=False) # IN (Entrada) ou OUT (Saída)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=False)
    category_id = Column(String, nullable=True) # ID ou String categorizando o ajuste
    reason = Column(String, nullable=False) # Motivo obrigatório para auditoria
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company")
    user = relationship("User")
