from typing import Optional, Sequence
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.repositories.base_repository import BaseRepository
from app.models.medical_record import MedicalRecord, Vitals


class MedicalRecordRepository(BaseRepository[MedicalRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(MedicalRecord, db)

    def _tenant_filter(self, doctor_id: UUID):
        return and_(MedicalRecord.doctor_id == doctor_id, MedicalRecord.is_deleted == False)

    async def get_by_id_for_doctor(self, id: UUID, doctor_id: UUID) -> Optional[MedicalRecord]:
        result = await self.db.execute(
            select(MedicalRecord)
            .options(selectinload(MedicalRecord.patient))
            .where(and_(MedicalRecord.id == id, self._tenant_filter(doctor_id)))
        )
        return result.scalar_one_or_none()

    async def get_for_patient(
        self, patient_id: UUID, doctor_id: UUID, skip: int = 0, limit: int = 20
    ) -> Sequence[MedicalRecord]:
        result = await self.db.execute(
            select(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.patient_id == patient_id,
                    self._tenant_filter(doctor_id),
                )
            )
            .order_by(MedicalRecord.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


class VitalsRepository(BaseRepository[Vitals]):
    def __init__(self, db: AsyncSession):
        super().__init__(Vitals, db)

    async def get_for_patient(
        self, patient_id: UUID, doctor_id: UUID, limit: int = 10
    ) -> Sequence[Vitals]:
        result = await self.db.execute(
            select(Vitals)
            .where(
                and_(
                    Vitals.patient_id == patient_id,
                    Vitals.doctor_id == doctor_id,
                    Vitals.is_deleted == False,
                )
            )
            .order_by(Vitals.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
