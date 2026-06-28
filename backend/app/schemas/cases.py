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
    frequency: str
    duration: str
    instructions: Optional[str] = None


class CaseCreate(BaseModel):
    # Patient identification (lookup or new)
    lookup: PatientLookup
    new_patient: Optional[PatientCreate] = None  # provided when no match found

    # Case / consultation details
    chief_complaint: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    prescriptions: Optional[List[PrescriptionItem]] = None
    follow_up_days: Optional[int] = None


class CaseResponse(BaseModel):
    case_id: UUID
    patient_id: UUID
    patient_name: str
    patient_phone: Optional[str]
    is_new_patient: bool
    created_at: datetime
