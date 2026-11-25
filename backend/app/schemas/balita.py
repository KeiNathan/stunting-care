from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from app.models.balita import GenderEnum

class BalitaCreate(BaseModel):
    nama          : str
    tanggal_lahir : date
    birth_length  : float = Field(gt=0)
    birth_weight  : float = Field(gt=0)
    jenis_kelamin : GenderEnum
    nama_ibu      : str
    ortu_id       : Optional[UUID] = None

class BalitaUpdate(BaseModel):
    nama          : Optional[str]        = None
    tanggal_lahir : Optional[date]       = None
    birth_length  : Optional[float]      = Field(default=None, gt=0)
    birth_weight  : Optional[float]      = Field(default=None, gt=0)
    nama_ibu      : Optional[str]        = None
    ortu_id       : Optional[UUID]       = None

class BalitaResponse(BaseModel):
    id            : UUID
    nama          : str
    tanggal_lahir : date
    birth_length  : Optional[float]
    birth_weight  : Optional[float]
    jenis_kelamin : GenderEnum
    nama_ibu      : str
    kader_id      : UUID
    ortu_id       : Optional[UUID]
    created_at    : datetime

    class Config:
        from_attributes = True