from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.medical_record_service import MedicalRecordService
from app.schemas.medical_record import (
    MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse,
    MedicalRecordListResponse, VitalsCreate, VitalsResponse
)

router = APIRouter(prefix="/records", tags=["Medical Records"])


@router.post("", response_model=MedicalRecordResponse, status_code=201)
async def create_record(
    data: MedicalRecordCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.create_record(current_doctor.id, data)


@router.get("/patient/{patient_id}", response_model=MedicalRecordListResponse)
async def list_records_for_patient(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.list_for_patient(patient_id, current_doctor.id, skip, limit)


@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_record(
    record_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.get_record(record_id, current_doctor.id)


@router.patch("/{record_id}", response_model=MedicalRecordResponse)
async def update_record(
    record_id: UUID,
    data: MedicalRecordUpdate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.update_record(record_id, current_doctor.id, data)


@router.post("/patient/{patient_id}/vitals", response_model=VitalsResponse, status_code=201)
async def add_vitals(
    patient_id: UUID,
    data: VitalsCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.add_vitals(patient_id, current_doctor.id, data)


@router.get("/patient/{patient_id}/vitals", response_model=list[VitalsResponse])
async def get_vitals_history(
    patient_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = MedicalRecordService(db)
    return await service.get_vitals_history(patient_id, current_doctor.id)
