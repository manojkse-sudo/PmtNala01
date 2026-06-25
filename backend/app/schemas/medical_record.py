from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class VitalsCreate(BaseModel):
    temperature_c: Optional[float] = None
    pulse_bpm: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    spo2_percent: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    respiratory_rate: Optional[int] = None
    medical_record_id: Optional[UUID] = None


class VitalsResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    temperature_c: Optional[float]
    pulse_bpm: Optional[int]
    bp_systolic: Optional[int]
    bp_diastolic: Optional[int]
    spo2_percent: Optional[float]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    respiratory_rate: Optional[int]
    bmi: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class MedicalRecordCreate(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    diagnosis_codes: Optional[list[dict]] = None
    prescriptions: Optional[list[dict]] = None
    lab_orders: Optional[list[dict]] = None
    follow_up_days: Optional[int] = None
    vitals: Optional[VitalsCreate] = None


class MedicalRecordUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    diagnosis_codes: Optional[list[dict]] = None
    prescriptions: Optional[list[dict]] = None
    lab_orders: Optional[list[dict]] = None
    follow_up_days: Optional[int] = None


class MedicalRecordResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    patient_id: UUID
    appointment_id: Optional[UUID]
    subjective: Optional[str]
    objective: Optional[str]
    assessment: Optional[str]
    plan: Optional[str]
    diagnosis_codes: Optional[list[Any]]
    prescriptions: Optional[list[Any]]
    lab_orders: Optional[list[Any]]
    follow_up_days: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MedicalRecordListResponse(BaseModel):
    items: list[MedicalRecordResponse]
    total: int
