from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class TitleSettlement(Base):
    __tablename__ = "title_settlements"

    id = Column(Integer, primary_key=True, index=True)
    title_type = Column(String, nullable=False, index=True) # PAYABLE ou RECEIVABLE
    title_id = Column(Integer, nullable=False, index=True) # ID da tabela account_payable ou account_receivable
    settlement_date = Column(Date, nullable=False, index=True) # Data da Baixa
    amount_paid = Column(Numeric(15, 2), nullable=False) # Valor Pago / Recebido
    bank_label = Column(String, nullable=True) # Banco onde ocorreu a baixa, se informado no ERP
    source_batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("ImportBatch")
    # Nota: A relação dinâmica com o título (payable/receivable) será gerenciada na camada de serviço 
    # pois o SQLAlchemy requer configuração adicional para polimorfismo ou chaves estrangeiras dinâmicas,
    # e manter os IDs soltos é mais simples e performático para este cenário.
