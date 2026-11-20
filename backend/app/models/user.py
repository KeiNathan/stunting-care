from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    kader = "kader"
    ortu  = "ortu"

class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama          = Column(String(100), nullable=False)
    email         = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum(RoleEnum), nullable=False)
    is_active     = Column(Boolean, default=True)
    can_predict   = Column(Boolean, default=False)  # hanya berlaku untuk ortu
    created_at    = Column(DateTime, default=datetime.utcnow)

    balita_kader  = relationship("Balita", foreign_keys="Balita.kader_id", back_populates="kader")
    balita_ortu   = relationship("Balita", foreign_keys="Balita.ortu_id",  back_populates="ortu")