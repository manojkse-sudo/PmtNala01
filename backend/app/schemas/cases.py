from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class PatientLookup(BaseModel):
    """Search criteria — at least one of phone/name must be provided."""
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None          # approximate age when DOB unknown
    date_of_birth: Optional[str] = None  # ISO date YYYY-MM-DD


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None


class PrescriptionItem(BaseModel):
    drug: str
    dose: str
    timing: str = "After food"   # Before food / After food / With food / Empty stomach
    days: str
    instructions: Optional[str] = None


class CaseCreate(BaseModel):
    # Option A: pass known patient_id directly (existing patient already confirmed in UI)
    patient_id: Optional[UUID] = None

    # Option B: lookup/create patient
    lookup: Optional[PatientLookup] = None
    new_patient: Optional[PatientCreate] = None

    # Case / consultation details
    chief_complaint: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    prescriptions: Optional[List[PrescriptionItem]] = None
    follow_up_tests: Optional[str] = None   # free-text for lab tests / scans
    follow_up_days: Optional[int] = None


class CaseResponse(BaseModel):
    case_id: UUID
    patient_id: UUID
    patient_name: str
    patient_phone: Optional[str]
    is_new_patient: bool
    created_at: datetime
