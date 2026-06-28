from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


class DoctorRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    license_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()


class DoctorLogin(BaseModel):
    email: EmailStr
    password: str


class DoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    license_number: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None


class DoctorResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str]
    specialty: Optional[str]
    clinic_name: Optional[str]
    clinic_address: Optional[str]
    license_number: Optional[str]
    avatar_url: Optional[str]
    timezone: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    doctor: DoctorResponse


class RefreshRequest(BaseModel):
    refresh_token: str
