from typing import Optional, Sequence
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.repositories.base_repository import BaseRepository
from app.models.patient import Patient


class PatientRepository(BaseRepository[Patient]):
    def __init__(self, db: AsyncSession):
        super().__init__(Patient, db)

    def _tenant_filter(self, doctor_id: UUID):
        """Base filter enforcing tenant isolation on every query."""
        return and_(Patient.doctor_id == doctor_id, Patient.is_deleted == False)

    async def get_by_id_for_doctor(self, id: UUID, doctor_id: UUID) -> Optional[Patient]:
        result = await self.db.execute(
            select(Patient).where(
                and_(Patient.id == id, self._tenant_filter(doctor_id))
            )
        )
        return result.scalar_one_or_none()

    async def get_all_for_doctor(
        self, doctor_id: UUID, skip: int = 0, limit: int = 50, search: str | None = None
    ) -> Sequence[Patient]:
        q = select(Patient).where(self._tenant_filter(doctor_id))
        if search:
            term = f"%{search}%"
            q = q.where(
                or_(
                    Patient.first_name.ilike(term),
                    Patient.last_name.ilike(term),
                    Patient.phone.ilike(term),
                    Patient.email.ilike(term),
                    Patient.patient_number.ilike(term),
                )
            )
        q = q.order_by(Patient.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(q)
        return result.scalars().all()

    async def count_for_doctor(self, doctor_id: UUID, search: str | None = None) -> int:
        q = select(func.count(Patient.id)).where(self._tenant_filter(doctor_id))
        if search:
            term = f"%{search}%"
            q = q.where(
                or_(
                    Patient.first_name.ilike(term),
                    Patient.last_name.ilike(term),
                    Patient.phone.ilike(term),
                )
            )
        result = await self.db.execute(q)
        return result.scalar_one()

    async def generate_patient_number(self, doctor_id: UUID) -> str:
        """Generate sequential patient number per doctor: P-0001, P-0002, ..."""
        count = await self.count_for_doctor(doctor_id)
        return f"P-{(count + 1):04d}"
