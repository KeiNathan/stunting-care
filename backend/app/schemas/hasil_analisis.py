from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.hasil_analisis import RiskLevelEnum

class HasilAnalisisResponse(BaseModel):
    id              : UUID
    pengukuran_id   : UUID
    haz             : float
    waz             : float
    whz             : float
    haz_status      : str
    waz_status      : str
    whz_status      : str
    stunting_status : str
    stunting_color  : str
    risk_level      : RiskLevelEnum
    risk_score      : float
    rekomendasi     : str
    interpretation  : str
    created_at      : datetime

    class Config:
        from_attributes = True

class PrediksiFullResponse(BaseModel):
    pengukuran   : dict
    hasil        : HasilAnalisisResponse