from sqlalchemy import Column, String, Float, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class Pengukuran(Base):
    __tablename__ = "pengukuran"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balita_id       = Column(UUID(as_uuid=True), ForeignKey("balita.id"), nullable=False)
    tanggal         = Column(Date, nullable=False)
    tinggi_cm       = Column(Float, nullable=False)
    berat_kg        = Column(Float, nullable=False)
    sanitasi        = Column(String(50), nullable=False)
    air_bersih      = Column(String(50), nullable=False)
    ekonomi         = Column(String(50), nullable=False)
    imunisasi       = Column(String(50), nullable=False)
    asi_eksklusif   = Column(Boolean, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relasi
    balita          = relationship("Balita", back_populates="pengukuran")
    hasil_analisis  = relationship("HasilAnalisis", back_populates="pengukuran",
                                   uselist=False, cascade="all, delete-orphan")