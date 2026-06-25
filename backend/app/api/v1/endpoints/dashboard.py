from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.repositories.patient_repository import PatientRepository
from app.repositories.appointment_repository import AppointmentRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_patients: int
    total_appointments: int
    today_appointments: int
    scheduled_appointments: int
    completed_appointments: int
    cancelled_appointments: int


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated stats for the doctor's dashboard."""
    patient_repo = PatientRepository(db)
    appt_repo = AppointmentRepository(db)

    from datetime import datetime, timezone
    from app.models.appointment import AppointmentStatus
    from sqlalchemy import select, func, and_

    total_patients = await patient_repo.count_for_doctor(current_doctor.id)
    stats = await appt_repo.get_stats(current_doctor.id)
    today_appts = await appt_repo.get_today_for_doctor(current_doctor.id)

    return DashboardStats(
        total_patients=total_patients,
        total_appointments=stats["total"],
        today_appointments=len(today_appts),
        scheduled_appointments=stats["scheduled"],
        completed_appointments=stats["completed"],
        cancelled_appointments=stats["cancelled"],
    )
