from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.appointment_service import AppointmentService
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    AppointmentListResponse, AppointmentStats
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    data: AppointmentCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.create_appointment(current_doctor.id, data)


@router.get("/today", response_model=list[AppointmentResponse])
async def get_today(
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.get_today(current_doctor.id)


@router.get("/stats", response_model=AppointmentStats)
async def get_stats(
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.get_stats(current_doctor.id)


@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[AppointmentStatus] = None,
    date: Optional[date] = None,
    patient_id: Optional[UUID] = None,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.list_appointments(
        current_doctor.id, skip, limit, status, date, patient_id
    )


@router.get("/{appt_id}", response_model=AppointmentResponse)
async def get_appointment(
    appt_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.get_appointment(appt_id, current_doctor.id)


@router.patch("/{appt_id}", response_model=AppointmentResponse)
async def update_appointment(
    appt_id: UUID,
    data: AppointmentUpdate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    return await service.update_appointment(appt_id, current_doctor.id, data)


@router.delete("/{appt_id}", status_code=204)
async def delete_appointment(
    appt_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    service = AppointmentService(db)
    await service.delete_appointment(appt_id, current_doctor.id)
