from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class AccountReceivable(Base):
    __tablename__ = "accounts_receivable"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    external_ref = Column(String, index=True, nullable=True) # ID interno do ERP
    customer_name = Column(String, nullable=False, index=True)
    document_no = Column(String, index=True) # NF-e, Docto, etc.
    due_date = Column(Date, nullable=False, index=True) # Vencimento Original
    due_date_real = Column(Date, nullable=True) # Vencimento Real / Prorrogado
    amount = Column(Numeric(15, 2), nullable=False) # Valor Original
    status = Column(String, nullable=False, index=True) # ABERTO, BAIXADO, CANCELADO
    history = Column(String, nullable=True) # Histórico / Observação
    raw_data = Column(JSON, nullable=True) # Dados originais da linha do Excel/ERP
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company")
    batch = relationship("ImportBatch")
