from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class SiteSettingResponse(BaseModel):
    key: str
    value: str
    label: Optional[str] = None
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SiteSettingUpdate(BaseModel):
    value: str


class SiteSettingsMap(BaseModel):
    """Flat dict of key -> value for easy frontend consumption."""
    settings: dict[str, str]


class AdminDoctorCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    license_number: Optional[str] = None
    is_admin: bool = False


class AdminDoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class AdminDoctorResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    date: str
    count: int


class TrendsResponse(BaseModel):
    daily: List[TrendPoint]
    weekly_total: int
    monthly_total: int
    today_total: int
