from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.user import RoleEnum

class UserCreate(BaseModel):
    nama        : str
    email       : EmailStr
    password    : str
    role        : RoleEnum
    can_predict : bool = False

class UserCreateOrtu(BaseModel):
    nama        : str
    email       : EmailStr
    password    : str
    balita_ids  : List[UUID]      # bisa lebih dari 1
    can_predict : bool = False

class UserUpdate(BaseModel):
    nama        : Optional[str]       = None
    email       : Optional[EmailStr]  = None
    is_active   : Optional[bool]      = None
    can_predict : Optional[bool]      = None

class UserResponse(BaseModel):
    id          : UUID
    nama        : str
    email       : str
    role        : RoleEnum
    is_active   : bool
    can_predict : bool
    created_at  : datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email    : EmailStr
    password : str

class TokenResponse(BaseModel):
    access_token : str
    token_type   : str
    role         : RoleEnum
    nama         : str
    user_id      : UUID
    can_predict  : bool