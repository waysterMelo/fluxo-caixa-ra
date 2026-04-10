from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String, nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String, nullable=False) # INSERT, UPDATE, DELETE
    before_json = Column(JSON, nullable=True)
    after_json = Column(JSON, nullable=True)
    user_id = Column(Integer, nullable=True) # Will link to Users table later
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
