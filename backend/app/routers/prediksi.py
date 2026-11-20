from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.pengukuran import Pengukuran
from app.models.hasil_analisis import HasilAnalisis, RiskLevelEnum
from app.models.balita import Balita
from app.models.user import User
from app.models.user import User, RoleEnum
from app.schemas.pengukuran import PengukuranCreate, PengukuranResponse
from app.schemas.hasil_analisis import HasilAnalisisResponse
from app.services.ml_service import predict_stunting
from app.dependencies import get_current_user, require_kader_or_admin
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/prediksi", tags=["Prediksi & Pengukuran"])

# ── Schema input prediksi ─────────────────────────────────────
class PrediksiInput(BaseModel):
    balita_id           : uuid.UUID
    tanggal             : date
    # Input utama dari kader
    tinggi_cm           : float
    berat_kg            : float
    sanitasi            : str
    air_bersih          : str
    ekonomi             : str
    imunisasi           : str
    asi_eksklusif       : bool
    # Fitur tambahan (opsional, pakai default jika tidak diisi)
    birth_length        : Optional[float] = 50.0
    birth_weight        : Optional[float] = 3.0
    mother_age          : Optional[float] = 28.0
    mother_height       : Optional[float] = 155.0
    mother_education    : Optional[str]   = "High School"
    mother_working      : Optional[int]   = 0
    father_education    : Optional[str]   = "High School"
    father_working      : Optional[int]   = 1
    anc_visits          : Optional[float] = 4.0
    complementary_age   : Optional[float] = 6.0
    diarrhea_freq       : Optional[float] = 0.0
    residence_type      : Optional[str]   = "Urban"
    deworming           : Optional[str]   = "Yes"

class PrediksiResponse(BaseModel):
    pengukuran : PengukuranResponse
    hasil      : HasilAnalisisResponse

    class Config:
        from_attributes = True


# ── POST /api/prediksi — input data & jalankan prediksi ──────
@router.post("/", response_model=PrediksiResponse, status_code=201)
def buat_prediksi(
    data        : PrediksiInput,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    # Ortu harus punya izin prediksi
    if current_user.role == RoleEnum.ortu and not current_user.can_predict:
        raise HTTPException(
            status_code=403,
            detail="Akun orang tua ini tidak memiliki izin untuk melakukan prediksi"
        )
    # Kader & Admin selalu bisa prediksi
    if current_user.role not in [RoleEnum.admin, RoleEnum.kader, RoleEnum.ortu]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    # Cek balita ada
    balita = db.query(Balita).filter(Balita.id == data.balita_id).first()
    if not balita:
        raise HTTPException(status_code=404, detail="Balita tidak ditemukan")

    # Hitung usia saat pengukuran (bulan)
    from dateutil.relativedelta import relativedelta
    delta      = relativedelta(data.tanggal, balita.tanggal_lahir)
    age_months = delta.years * 12 + delta.months
    gender     = balita.jenis_kelamin.value  # "M" atau "F"

    # Jalankan ML + Z-Score
    hasil_ml = predict_stunting(
        age_months        = age_months,
        gender            = gender,
        height_cm         = data.tinggi_cm,
        weight_kg         = data.berat_kg,
        birth_length      = data.birth_length,
        birth_weight      = data.birth_weight,
        mother_age        = data.mother_age,
        mother_height     = data.mother_height,
        anc_visits        = data.anc_visits,
        mother_education  = data.mother_education,
        mother_working    = data.mother_working,
        father_education  = data.father_education,
        father_working    = data.father_working,
        exclusive_bf      = "Yes" if data.asi_eksklusif else "No",
        complementary_age = data.complementary_age,
        immunization      = data.imunisasi,
        diarrhea_freq     = data.diarrhea_freq,
        water_source      = data.air_bersih,
        sanitation        = data.sanitasi,
        economic_level    = data.ekonomi,
        residence_type    = data.residence_type,
        deworming         = data.deworming,
    )

    zscore = hasil_ml["zscore"]
    if "error" in zscore:
        raise HTTPException(status_code=400, detail=f"Z-Score error: {zscore['error']}")

    # Simpan pengukuran
    pengukuran = Pengukuran(
        id            = uuid.uuid4(),
        balita_id     = data.balita_id,
        tanggal       = data.tanggal,
        tinggi_cm     = data.tinggi_cm,
        berat_kg      = data.berat_kg,
        sanitasi      = data.sanitasi,
        air_bersih    = data.air_bersih,
        ekonomi       = data.ekonomi,
        imunisasi     = data.imunisasi,
        asi_eksklusif = data.asi_eksklusif,
    )
    db.add(pengukuran)
    db.flush()

    # Simpan hasil analisis
    hasil = HasilAnalisis(
        id              = uuid.uuid4(),
        pengukuran_id   = pengukuran.id,
        haz             = zscore["haz"],
        waz             = zscore["waz"],
        whz             = zscore["whz"],
        haz_status      = zscore["haz_status"],
        waz_status      = zscore["waz_status"],
        whz_status      = zscore["whz_status"],
        stunting_status = zscore["stunting_status"],
        stunting_color  = zscore["stunting_color"],
        risk_level      = RiskLevelEnum(hasil_ml["risk_level"]),
        risk_score      = hasil_ml["risk_score"],
        rekomendasi     = hasil_ml["rekomendasi"],
        interpretation  = zscore["interpretation"],
    )
    db.add(hasil)
    db.commit()
    db.refresh(pengukuran)
    db.refresh(hasil)

    return {"pengukuran": pengukuran, "hasil": hasil}


# ── GET /api/prediksi/balita/{balita_id} — riwayat pengukuran ─
@router.get("/balita/{balita_id}", response_model=List[PrediksiResponse])
def get_riwayat_balita(
    balita_id   : uuid.UUID,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    pengukuran_list = (
        db.query(Pengukuran)
        .filter(Pengukuran.balita_id == balita_id)
        .order_by(Pengukuran.tanggal.asc())
        .all()
    )
    result = []
    for p in pengukuran_list:
        if p.hasil_analisis:
            result.append({"pengukuran": p, "hasil": p.hasil_analisis})
    return result


# ── GET /api/prediksi/{pengukuran_id} — detail satu pengukuran ─
@router.get("/{pengukuran_id}", response_model=PrediksiResponse)
def get_detail_prediksi(
    pengukuran_id: uuid.UUID,
    db           : Session = Depends(get_db),
    current_user : User    = Depends(get_current_user)
):
    p = db.query(Pengukuran).filter(Pengukuran.id == pengukuran_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pengukuran tidak ditemukan")
    if not p.hasil_analisis:
        raise HTTPException(status_code=404, detail="Hasil analisis tidak ditemukan")
    return {"pengukuran": p, "hasil": p.hasil_analisis}