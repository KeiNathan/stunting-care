from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class PengukuranCreate(BaseModel):
    balita_id     : UUID
    tanggal       : date
    tinggi_cm     : float
    berat_kg      : float
    sanitasi      : str
    air_bersih    : str
    ekonomi       : str
    imunisasi     : str
    asi_eksklusif : bool

class PengukuranResponse(BaseModel):
    id            : UUID
    balita_id     : UUID
    tanggal       : date
    tinggi_cm     : float
    berat_kg      : float
    sanitasi      : str
    air_bersih    : str
    ekonomi       : str
    imunisasi     : str
    asi_eksklusif : bool
    created_at    : datetime

    class Config:
        from_attributes = True