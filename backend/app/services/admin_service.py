from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.doctor_repository import DoctorRepository
from app.repositories.site_settings_repository import SiteSettingsRepository
from app.core.security import hash_password
from app.schemas.admin import AdminDoctorCreate, AdminDoctorUpdate, TrendsResponse, TrendPoint
from app.models.doctor import Doctor


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.settings_repo = SiteSettingsRepository(db)

    # ── Settings ──────────────────────────────────────────────────────────────

    async def get_settings(self) -> dict[str, str]:
        return await self.settings_repo.get_map()

    async def update_settings(self, updates: dict[str, str]) -> dict[str, str]:
        await self.settings_repo.set_many(updates)
        return await self.settings_repo.get_map()

    # ── Doctor management ─────────────────────────────────────────────────────

    async def list_doctors(self) -> list[Doctor]:
        from sqlalchemy import select
        from app.models.doctor import Doctor as DoctorModel
        result = await self.db.execute(
            select(DoctorModel)
            .where(DoctorModel.is_deleted == False)
            .order_by(DoctorModel.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_doctor(self, data: AdminDoctorCreate) -> Doctor:
        if await self.doctor_repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A doctor with this email already exists",
            )
        return await self.doctor_repo.create(
            email=data.email.lower().strip(),
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            specialty=data.specialty,
            clinic_name=data.clinic_name,
            license_number=data.license_number,
            is_admin=data.is_admin,
        )

    async def update_doctor(self, doctor_id, data: AdminDoctorUpdate) -> Doctor:
        from uuid import UUID
        doctor = await self.doctor_repo.get_by_id(UUID(str(doctor_id)))
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return await self.doctor_repo.update(doctor, **data.model_dump(exclude_unset=True))

    async def deactivate_doctor(self, doctor_id) -> Doctor:
        from uuid import UUID
        doctor = await self.doctor_repo.get_by_id(UUID(str(doctor_id)))
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return await self.doctor_repo.update(doctor, is_active=False)
