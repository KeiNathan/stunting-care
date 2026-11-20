from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid
import enum

class RiskLevelEnum(str, enum.Enum):
    Low    = "Low"
    Medium = "Medium"
    High   = "High"

class HasilAnalisis(Base):
    __tablename__ = "hasil_analisis"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pengukuran_id   = Column(UUID(as_uuid=True), ForeignKey("pengukuran.id"), nullable=False)
    haz             = Column(Float, nullable=False)
    waz             = Column(Float, nullable=False)
    whz             = Column(Float, nullable=False)
    haz_status      = Column(String(30), nullable=False)
    waz_status      = Column(String(30), nullable=False)
    whz_status      = Column(String(30), nullable=False)
    stunting_status = Column(String(30), nullable=False)
    stunting_color  = Column(String(10), nullable=False)
    risk_level      = Column(Enum(RiskLevelEnum), nullable=False)
    risk_score      = Column(Float, nullable=False)
    rekomendasi     = Column(String(500), nullable=False)
    interpretation  = Column(String(500), nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relasi
    pengukuran      = relationship("Pengukuran", back_populates="hasil_analisis")