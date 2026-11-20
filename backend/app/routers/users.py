from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.balita import Balita
from app.schemas.user import UserCreate, UserCreateOrtu, UserResponse, UserUpdate
from app.services.auth import hash_password
from app.dependencies import get_current_user, require_admin, require_kader_or_admin
import uuid

router = APIRouter(prefix="/api/users", tags=["Manajemen User"])

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    return db.query(User).all()

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(
    data        : UserCreate,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    user = User(
        id            = uuid.uuid4(),
        nama          = data.nama,
        email         = data.email,
        password_hash = hash_password(data.password),
        role          = data.role,
        can_predict   = data.can_predict,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/ortu", response_model=UserResponse, status_code=201)
def create_ortu(
    data        : UserCreateOrtu,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    # Cek email sudah ada
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    # Validasi semua balita_ids
    for balita_id in data.balita_ids:
        balita = db.query(Balita).filter(Balita.id == balita_id).first()
        if not balita:
            raise HTTPException(status_code=404, detail=f"Balita tidak ditemukan")
        if balita.ortu_id:
            raise HTTPException(
                status_code=400,
                detail=f"Balita '{balita.nama}' sudah terhubung ke akun orang tua lain"
            )

    # Buat akun ortu
    ortu = User(
        id            = uuid.uuid4(),
        nama          = data.nama,
        email         = data.email,
        password_hash = hash_password(data.password),
        role          = RoleEnum.ortu,
        can_predict   = data.can_predict,
    )
    db.add(ortu)
    db.flush()

    # Hubungkan semua balita ke ortu
    for balita_id in data.balita_ids:
        balita = db.query(Balita).filter(Balita.id == balita_id).first()
        balita.ortu_id = ortu.id

    db.commit()
    db.refresh(ortu)
    return ortu

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id     : uuid.UUID,
    data        : UserUpdate,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    if current_user.role == RoleEnum.kader and user.role != RoleEnum.ortu:
        raise HTTPException(status_code=403, detail="Kader hanya bisa mengubah akun orang tua")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id     : uuid.UUID,
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    db.delete(user)
    db.commit()

@router.get("/ortu/list", response_model=List[UserResponse])
def get_ortu_list(
    db          : Session = Depends(get_db),
    current_user: User    = Depends(require_kader_or_admin)
):
    return db.query(User).filter(User.role == RoleEnum.ortu).all()