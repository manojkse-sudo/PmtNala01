from typing import Optional, Sequence
from uuid import UUID
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
from sqlalchemy.orm import selectinload

from app.repositories.base_repository import BaseRepository
from app.models.appointment import Appointment, AppointmentStatus


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Appointment, db)

    def _tenant_filter(self, doctor_id: UUID):
        return and_(Appointment.doctor_id == doctor_id, Appointment.is_deleted == False)

    async def get_by_id_for_doctor(self, id: UUID, doctor_id: UUID) -> Optional[Appointment]:
        result = await self.db.execute(
            select(Appointment)
            .options(selectinload(Appointment.patient))
            .where(and_(Appointment.id == id, self._tenant_filter(doctor_id)))
        )
        return result.scalar_one_or_none()

    async def get_for_doctor(
        self,
        doctor_id: UUID,
        skip: int = 0,
        limit: int = 50,
        status: AppointmentStatus | None = None,
        date_filter: date | None = None,
        patient_id: UUID | None = None,
    ) -> Sequence[Appointment]:
        q = (
            select(Appointment)
            .options(selectinload(Appointment.patient))
            .where(self._tenant_filter(doctor_id))
        )
        if status:
            q = q.where(Appointment.status == status)
        if date_filter:
            q = q.where(func.date(Appointment.scheduled_at) == date_filter)
        if patient_id:
            q = q.where(Appointment.patient_id == patient_id)
        q = q.order_by(Appointment.scheduled_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(q)
        return result.scalars().all()

    async def count_for_doctor(self, doctor_id: UUID, status: AppointmentStatus | None = None) -> int:
        q = select(func.count(Appointment.id)).where(self._tenant_filter(doctor_id))
        if status:
            q = q.where(Appointment.status == status)
        result = await self.db.execute(q)
        return result.scalar_one()

    async def get_today_for_doctor(self, doctor_id: UUID) -> Sequence[Appointment]:
        today = datetime.now(timezone.utc).date()
        return await self.get_for_doctor(doctor_id, date_filter=today, limit=100)

    async def get_stats(self, doctor_id: UUID) -> dict:
        total = await self.count_for_doctor(doctor_id)
        scheduled = await self.count_for_doctor(doctor_id, AppointmentStatus.SCHEDULED)
        completed = await self.count_for_doctor(doctor_id, AppointmentStatus.COMPLETED)
        cancelled = await self.count_for_doctor(doctor_id, AppointmentStatus.CANCELLED)
        return {
            "total": total,
            "scheduled": scheduled,
            "completed": completed,
            "cancelled": cancelled,
        }
