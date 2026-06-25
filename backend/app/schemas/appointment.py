from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.appointment import AppointmentStatus, AppointmentType
from app.schemas.patient import PatientResponse


class AppointmentCreate(BaseModel):
    patient_id: UUID
    scheduled_at: datetime
    duration_minutes: int = 30
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    fee: Optional[int] = None  # in paise


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[AppointmentStatus] = None
    appointment_type: Optional[AppointmentType] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    fee: Optional[int] = None


class AppointmentResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    patient_id: UUID
    patient: Optional[PatientResponse] = None
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    appointment_type: AppointmentType
    chief_complaint: Optional[str]
    notes: Optional[str]
    fee: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentListResponse(BaseModel):
    items: list[AppointmentResponse]
    total: int
    skip: int
    limit: int


class AppointmentStats(BaseModel):
    total: int
    scheduled: int
    completed: int
    cancelled: int
