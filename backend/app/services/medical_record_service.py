from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.repositories.medical_record_repository import MedicalRecordRepository, VitalsRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.medical_record import (
    MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse,
    MedicalRecordListResponse, VitalsCreate, VitalsResponse
)


class MedicalRecordService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MedicalRecordRepository(db)
        self.vitals_repo = VitalsRepository(db)
        self.patient_repo = PatientRepository(db)

    async def create_record(self, doctor_id: UUID, data: MedicalRecordCreate) -> MedicalRecordResponse:
        patient = await self.patient_repo.get_by_id_for_doctor(data.patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        vitals_data = data.vitals
        record_data = data.model_dump(exclude={"vitals"}, exclude_unset=True)

        record = await self.repo.create(doctor_id=doctor_id, **record_data)

        if vitals_data:
            await self.vitals_repo.create(
                doctor_id=doctor_id,
                patient_id=data.patient_id,
                medical_record_id=record.id,
                **vitals_data.model_dump(exclude_unset=True, exclude={"medical_record_id"}),
            )

        return MedicalRecordResponse.model_validate(record)

    async def get_record(self, record_id: UUID, doctor_id: UUID) -> MedicalRecordResponse:
        record = await self.repo.get_by_id_for_doctor(record_id, doctor_id)
        if not record:
            raise HTTPException(status_code=404, detail="Medical record not found")
        return MedicalRecordResponse.model_validate(record)

    async def list_for_patient(
        self, patient_id: UUID, doctor_id: UUID, skip: int = 0, limit: int = 20
    ) -> MedicalRecordListResponse:
        # Verify patient belongs to doctor
        patient = await self.patient_repo.get_by_id_for_doctor(patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        records = await self.repo.get_for_patient(patient_id, doctor_id, skip, limit)
        return MedicalRecordListResponse(
            items=[MedicalRecordResponse.model_validate(r) for r in records],
            total=len(records),
        )

    async def update_record(
        self, record_id: UUID, doctor_id: UUID, data: MedicalRecordUpdate
    ) -> MedicalRecordResponse:
        record = await self.repo.get_by_id_for_doctor(record_id, doctor_id)
        if not record:
            raise HTTPException(status_code=404, detail="Medical record not found")
        updated = await self.repo.update(record, **data.model_dump(exclude_unset=True))
        return MedicalRecordResponse.model_validate(updated)

    async def add_vitals(
        self, patient_id: UUID, doctor_id: UUID, data: VitalsCreate
    ) -> VitalsResponse:
        patient = await self.patient_repo.get_by_id_for_doctor(patient_id, doctor_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        vitals = await self.vitals_repo.create(
            doctor_id=doctor_id,
            patient_id=patient_id,
            **data.model_dump(exclude_unset=True),
        )
        return VitalsResponse.model_validate(vitals)

    async def get_vitals_history(
        self, patient_id: UUID, doctor_id: UUID
    ) -> list[VitalsResponse]:
        records = await self.vitals_repo.get_for_patient(patient_id, doctor_id)
        return [VitalsResponse.model_validate(v) for v in records]
