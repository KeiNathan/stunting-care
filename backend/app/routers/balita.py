from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.balita import Balita
from app.models.user import User, RoleEnum
from app.schemas.balita import BalitaCreate, BalitaResponse, BalitaUpdate
from app.dependencies import get_current_user, require_kader_or_admin
import uuid

router = APIRouter(prefix="/api/balita", tags=["Manajemen Balita"])

@router.get("/", response_model=List[BalitaResponse])
def get_balita(
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    # Admin & Kader: lihat SEMUA balita
    if current_user.role in [RoleEnum.admin, RoleEnum.kader]:
        return db.query(Balita).all()
    # Ortu: hanya balita miliknya
    else:
        return db.query(Balita).filter(Balita.ortu_id == current_user.id).all()

@router.post("/", response_model=BalitaResponse, status_code=201)
def create_balita(
    data        : BalitaCreate,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    balita = Balita(
        id            = uuid.uuid4(),
        nama          = data.nama,
        tanggal_lahir = data.tanggal_lahir,
        jenis_kelamin = data.jenis_kelamin,
        nama_ibu      = data.nama_ibu,
        kader_id      = current_user.id,
        ortu_id       = data.ortu_id,
    )
    db.add(balita)
    db.commit()
    db.refresh(balita)
    return balita

@router.get("/", response_model=BalitaResponse)
def get_balita(
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    if current_user.role in [RoleEnum.admin, RoleEnum.kader]:
        return db.query(Balita).all()
    else:
        return db.query(Balita).filter(Balita.ortu_id == current_user.id).all()

@router.put("/{balita_id}", response_model=BalitaResponse)
def update_balita(
    balita_id   : uuid.UUID,
    data        : BalitaUpdate,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    balita = db.query(Balita).filter(Balita.id == balita_id).first()
    if not balita:
        raise HTTPException(status_code=404, detail="Balita tidak ditemukan")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(balita, field, value)
    db.commit()
    db.refresh(balita)
    return balita

@router.delete("/{balita_id}", status_code=204)
def delete_balita(
    balita_id   : uuid.UUID,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    balita = db.query(Balita).filter(Balita.id == balita_id).first()
    if not balita:
        raise HTTPException(status_code=404, detail="Balita tidak ditemukan")
    db.delete(balita)
    db.commit()