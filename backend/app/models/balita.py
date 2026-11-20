from sqlalchemy import Column, String, Date, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid
import enum

class GenderEnum(str, enum.Enum):
    M = "M"
    F = "F"

class Balita(Base):
    __tablename__ = "balita"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama           = Column(String(100), nullable=False)
    tanggal_lahir  = Column(Date, nullable=False)
    jenis_kelamin  = Column(Enum(GenderEnum), nullable=False)
    nama_ibu       = Column(String(100), nullable=False)
    kader_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ortu_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

    # Relasi
    kader          = relationship("User", foreign_keys=[kader_id], back_populates="balita_kader")
    ortu           = relationship("User", foreign_keys=[ortu_id],  back_populates="balita_ortu")
    pengukuran     = relationship("Pengukuran", back_populates="balita", cascade="all, delete-orphan")