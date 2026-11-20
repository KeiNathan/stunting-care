from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.balita import Balita
from app.models.pengukuran import Pengukuran
from app.models.hasil_analisis import HasilAnalisis, RiskLevelEnum
from app.models.user import User, RoleEnum
from app.dependencies import require_kader_or_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/statistik")
def get_statistik(
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    # Filter berdasarkan role
    if current_user.role == RoleEnum.kader:
        balita_ids = [b.id for b in db.query(Balita).filter(
            Balita.kader_id == current_user.id).all()]
        total_balita = len(balita_ids)
        hasil_query  = db.query(HasilAnalisis).join(Pengukuran).filter(
            Pengukuran.balita_id.in_(balita_ids))
    else:
        total_balita = db.query(Balita).count()
        hasil_query  = db.query(HasilAnalisis)

    # Distribusi risk level (ambil pengukuran terakhir per balita)
    subquery = (
        db.query(
            Pengukuran.balita_id,
            func.max(Pengukuran.tanggal).label("latest_date")
        )
        .group_by(Pengukuran.balita_id)
        .subquery()
    )

    latest_hasil = (
        db.query(HasilAnalisis)
        .join(Pengukuran, HasilAnalisis.pengukuran_id == Pengukuran.id)
        .join(subquery, (Pengukuran.balita_id == subquery.c.balita_id) &
              (Pengukuran.tanggal == subquery.c.latest_date))
        .all()
    )

    risk_dist = {"Low": 0, "Medium": 0, "High": 0}
    stunting_dist = {"Normal": 0, "Stunting": 0, "Stunting Berat": 0}

    for h in latest_hasil:
        risk_dist[h.risk_level.value] += 1
        stunting_dist[h.stunting_status] += 1

    total_pengukuran = db.query(Pengukuran).count()
    total_kader      = db.query(User).filter(User.role == RoleEnum.kader).count()

    return {
        "total_balita"     : total_balita,
        "total_pengukuran" : total_pengukuran,
        "total_kader"      : total_kader,
        "distribusi_risiko": risk_dist,
        "distribusi_stunting": stunting_dist,
    }