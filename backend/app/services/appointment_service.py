from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.patient_repository import PatientRepository
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    AppointmentListResponse, AppointmentStats
)


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppointmentRepository(db)
        self.patient_repo = PatientRepository(db)

    async def create_appointment(self, doctor_id: UUID, data: AppointmentCreate) -> AppointmentResponse:
        # Verify patient belongs to this doctor
        patient = await self.patient_repo.get_by_id_for_doctor(data.patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        appt = await self.repo.create(
            doctor_id=doctor_id,
            **data.model_dump(exclude_unset=True),
        )
        # Reload with patient relationship
        appt = await self.repo.get_by_id_for_doctor(appt.id, doctor_id)
        return AppointmentResponse.model_validate(appt)

    async def get_appointment(self, appt_id: UUID, doctor_id: UUID) -> AppointmentResponse:
        appt = await self.repo.get_by_id_for_doctor(appt_id, doctor_id)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return AppointmentResponse.model_validate(appt)

    async def list_appointments(
        self,
        doctor_id: UUID,
        skip: int = 0,
        limit: int = 50,
        status: AppointmentStatus | None = None,
        date_filter: date | None = None,
        patient_id: UUID | None = None,
    ) -> AppointmentListResponse:
        appts = await self.repo.get_for_doctor(doctor_id, skip, limit, status, date_filter, patient_id)
        total = await self.repo.count_for_doctor(doctor_id, status)
        return AppointmentListResponse(
            items=[AppointmentResponse.model_validate(a) for a in appts],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_appointment(
        self, appt_id: UUID, doctor_id: UUID, data: AppointmentUpdate
    ) -> AppointmentResponse:
        appt = await self.repo.get_by_id_for_doctor(appt_id, doctor_id)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        updated = await self.repo.update(appt, **data.model_dump(exclude_unset=True))
        updated = await self.repo.get_by_id_for_doctor(updated.id, doctor_id)
        return AppointmentResponse.model_validate(updated)

    async def get_today(self, doctor_id: UUID) -> list[AppointmentResponse]:
        appts = await self.repo.get_today_for_doctor(doctor_id)
        return [AppointmentResponse.model_validate(a) for a in appts]

    async def get_stats(self, doctor_id: UUID) -> AppointmentStats:
        stats = await self.repo.get_stats(doctor_id)
        return AppointmentStats(**stats)

    async def delete_appointment(self, appt_id: UUID, doctor_id: UUID) -> None:
        appt = await self.repo.get_by_id_for_doctor(appt_id, doctor_id)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        await self.repo.soft_delete(appt)
