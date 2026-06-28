from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.repositories.patient_repository import PatientRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.schemas.admin import TrendsResponse, TrendPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_patients: int
    total_appointments: int
    today_appointments: int
    scheduled_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    today_cases: int


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated stats for the doctor's dashboard."""
    from datetime import datetime, timezone, date
    from sqlalchemy import select, func, and_
    from app.models.medical_record import MedicalRecord

    patient_repo = PatientRepository(db)
    appt_repo = AppointmentRepository(db)

    total_patients = await patient_repo.count_for_doctor(current_doctor.id)
    stats = await appt_repo.get_stats(current_doctor.id)
    today_appts = await appt_repo.get_today_for_doctor(current_doctor.id)

    # Count today's medical records (walk-in cases)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)
    cases_result = await db.execute(
        select(func.count(MedicalRecord.id)).where(
            and_(
                MedicalRecord.doctor_id == current_doctor.id,
                MedicalRecord.is_deleted == False,
                MedicalRecord.created_at >= today_start,
                MedicalRecord.created_at <= today_end,
            )
        )
    )
    today_cases = cases_result.scalar_one()

    return DashboardStats(
        total_patients=total_patients,
        total_appointments=stats["total"],
        today_appointments=len(today_appts),
        scheduled_appointments=stats["scheduled"],
        completed_appointments=stats["completed"],
        cancelled_appointments=stats["cancelled"],
        today_cases=today_cases,
    )


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Daily patient case counts for the past 30 days + weekly/monthly aggregates."""
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import select, func, and_, cast, Date
    from app.models.medical_record import MedicalRecord

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    # Daily counts over past 30 days
    result = await db.execute(
        select(
            cast(MedicalRecord.created_at, Date).label("day"),
            func.count(MedicalRecord.id).label("count"),
        )
        .where(
            and_(
                MedicalRecord.doctor_id == current_doctor.id,
                MedicalRecord.is_deleted == False,
                MedicalRecord.created_at >= thirty_days_ago,
            )
        )
        .group_by(cast(MedicalRecord.created_at, Date))
        .order_by(cast(MedicalRecord.created_at, Date))
    )
    rows = result.all()
    daily_map = {str(r.day): r.count for r in rows}

    # Fill gaps with zeros for all 30 days
    daily: list[TrendPoint] = []
    for i in range(30, -1, -1):
        d = (now - timedelta(days=i)).date()
        daily.append(TrendPoint(date=str(d), count=daily_map.get(str(d), 0)))

    weekly_total = sum(p.count for p in daily[-7:])
    monthly_total = sum(p.count for p in daily)
    today_total = daily[-1].count if daily else 0

    return TrendsResponse(
        daily=daily,
        weekly_total=weekly_total,
        monthly_total=monthly_total,
        today_total=today_total,
    )
