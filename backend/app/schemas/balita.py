from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from app.models.balita import GenderEnum

class BalitaCreate(BaseModel):
    nama          : str
    tanggal_lahir : date
    jenis_kelamin : GenderEnum
    nama_ibu      : str
    ortu_id       : Optional[UUID] = None

class BalitaUpdate(BaseModel):
    nama          : Optional[str]        = None
    tanggal_lahir : Optional[date]       = None
    nama_ibu      : Optional[str]        = None
    ortu_id       : Optional[UUID]       = None

class BalitaResponse(BaseModel):
    id            : UUID
    nama          : str
    tanggal_lahir : date
    jenis_kelamin : GenderEnum
    nama_ibu      : str
    kader_id      : UUID
    ortu_id       : Optional[UUID]
    created_at    : datetime

    class Config:
        from_attributes = True