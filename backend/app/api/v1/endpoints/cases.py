"""
Walk-in case creation endpoint.

Flow:
  1. Receive lookup criteria (phone / name / DOB).
  2. Search the doctor's patient table for a match.
  3a. Match found  → use existing patient.
  3b. No match     → create a new patient record from new_patient payload.
  4. Create a MedicalRecord (no appointment_id required).
  5. Return case_id, patient_id, is_new_patient flag.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.schemas.cases import CaseCreate, CaseResponse
from app.repositories.patient_repository import PatientRepository
from app.repositories.base_repository import BaseRepository
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord

router = APIRouter(prefix="/cases", tags=["Cases"])


async def _lookup_patient(db: AsyncSession, doctor_id, lookup) -> Patient | None:
    """
    Try to find a matching patient using phone OR (first_name + last_name).
    Returns the first match or None.
    """
    conditions = [
        and_(Patient.doctor_id == doctor_id, Patient.is_deleted == False)
    ]
    search_clauses = []

    if lookup.phone:
        search_clauses.append(Patient.phone == lookup.phone.strip())

    if lookup.first_name and lookup.last_name:
        search_clauses.append(
            and_(
                Patient.first_name.ilike(lookup.first_name.strip()),
                Patient.last_name.ilike(lookup.last_name.strip()),
            )
        )

    if not search_clauses:
        return None

    result = await db.execute(
        select(Patient)
        .where(and_(*conditions, or_(*search_clauses)))
        .order_by(Patient.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.post("", response_model=CaseResponse, status_code=201)
async def create_case(
    data: CaseCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a walk-in case.
    Path A: patient_id provided → use directly (patient already confirmed in UI).
    Path B: lookup by phone/name → use match or create new patient.
    """
    from uuid import UUID as PyUUID
    patient_repo = PatientRepository(db)
    is_new = False
    patient = None

    # ── Path A: patient_id already known ──────────────────────────────────────
    if data.patient_id:
        result = await db.execute(
            select(Patient).where(
                and_(
                    Patient.id == data.patient_id,
                    Patient.doctor_id == current_doctor.id,
                    Patient.is_deleted == False,
                )
            )
        )
        patient = result.scalar_one_or_none()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

    # ── Path B: lookup / create ───────────────────────────────────────────────
    else:
        if data.lookup:
            patient = await _lookup_patient(db, current_doctor.id, data.lookup)

        if not patient:
            if not data.new_patient:
                raise HTTPException(
                    status_code=422,
                    detail="No matching patient found. Provide new_patient details to register.",
                )
            np = data.new_patient
            patient_number = await patient_repo.generate_patient_number(current_doctor.id)

            dob = np.date_of_birth
            if not dob and np.age:
                from datetime import date
                approx_year = datetime.now().year - np.age
                dob = str(date(approx_year, 1, 1))

            patient = await patient_repo.create(
                doctor_id=current_doctor.id,
                first_name=np.first_name,
                last_name=np.last_name,
                phone=np.phone,
                date_of_birth=dob,
                gender=np.gender,
                blood_group=np.blood_group,
                allergies=np.allergies,
                chronic_conditions=np.chronic_conditions,
                patient_number=patient_number,
            )
            is_new = True

    # ── Create the medical record ─────────────────────────────────────────────
    def na(v):
        """Return 'NA' for blank/None values."""
        return v if v and v.strip() else "NA"

    # Combine chief_complaint into subjective (MedicalRecord has no separate field for it)
    cc = na(data.chief_complaint)
    subj_body = na(data.subjective)
    combined_subjective = f"Chief Complaint: {cc}\n\n{subj_body}" if cc != "NA" else subj_body

    record = MedicalRecord(
        doctor_id=current_doctor.id,
        patient_id=patient.id,
        appointment_id=None,
        subjective=combined_subjective,
        objective="NA",
        assessment=na(data.assessment),
        plan=na(data.plan),
        prescriptions=[p.model_dump() for p in data.prescriptions] if data.prescriptions else [],
        lab_orders={"follow_up_tests": data.follow_up_tests or "NA"},
        follow_up_days=data.follow_up_days,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    await db.commit()

    return CaseResponse(
        case_id=record.id,
        patient_id=patient.id,
        patient_name=patient.full_name,
        patient_phone=patient.phone,
        is_new_patient=is_new,
        created_at=record.created_at,
    )


@router.get("/lookup")
async def lookup_patient(
    phone: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick patient search for the Create Case form.
    Returns up to 5 matches so the doctor can confirm before proceeding.
    """
    from sqlalchemy import select, and_, or_
    if not phone and not (first_name or last_name):
        return {"matches": []}

    clauses = []
    if phone:
        clauses.append(Patient.phone == phone.strip())
    if first_name:
        clauses.append(Patient.first_name.ilike(f"%{first_name.strip()}%"))
    if last_name:
        clauses.append(Patient.last_name.ilike(f"%{last_name.strip()}%"))

    result = await db.execute(
        select(Patient)
        .where(
            and_(
                Patient.doctor_id == current_doctor.id,
                Patient.is_deleted == False,
                or_(*clauses),
            )
        )
        .order_by(Patient.created_at.desc())
        .limit(5)
    )
    patients = result.scalars().all()

    return {
        "matches": [
            {
                "id": str(p.id),
                "full_name": p.full_name,
                "phone": p.phone,
                "patient_number": p.patient_number,
                "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            }
            for p in patients
        ]
    }
