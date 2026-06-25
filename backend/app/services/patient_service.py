from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.patient_repository import PatientRepository
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PatientRepository(db)

    async def create_patient(self, doctor_id: UUID, data: PatientCreate) -> PatientResponse:
        patient_number = await self.repo.generate_patient_number(doctor_id)
        patient = await self.repo.create(
            doctor_id=doctor_id,
            patient_number=patient_number,
            **data.model_dump(exclude_unset=True),
        )
        return PatientResponse.model_validate(patient)

    async def get_patient(self, patient_id: UUID, doctor_id: UUID) -> PatientResponse:
        patient = await self.repo.get_by_id_for_doctor(patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return PatientResponse.model_validate(patient)

    async def list_patients(
        self, doctor_id: UUID, skip: int = 0, limit: int = 50, search: str | None = None
    ) -> PatientListResponse:
        patients = await self.repo.get_all_for_doctor(doctor_id, skip, limit, search)
        total = await self.repo.count_for_doctor(doctor_id, search)
        return PatientListResponse(
            items=[PatientResponse.model_validate(p) for p in patients],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_patient(
        self, patient_id: UUID, doctor_id: UUID, data: PatientUpdate
    ) -> PatientResponse:
        patient = await self.repo.get_by_id_for_doctor(patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        updated = await self.repo.update(patient, **data.model_dump(exclude_unset=True))
        return PatientResponse.model_validate(updated)

    async def delete_patient(self, patient_id: UUID, doctor_id: UUID) -> None:
        patient = await self.repo.get_by_id_for_doctor(patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        await self.repo.soft_delete(patient)
