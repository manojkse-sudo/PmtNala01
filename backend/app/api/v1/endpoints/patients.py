from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.patient_service import PatientService
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(
    data: PatientCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    return await service.create_patient(current_doctor.id, data)


@router.get("", response_model=PatientListResponse)
async def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, min_length=1),
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    return await service.list_patients(current_doctor.id, skip, limit, search)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    return await service.get_patient(patient_id, current_doctor.id)


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    data: PatientUpdate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    return await service.update_patient(patient_id, current_doctor.id, data)


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    await service.delete_patient(patient_id, current_doctor.id)
