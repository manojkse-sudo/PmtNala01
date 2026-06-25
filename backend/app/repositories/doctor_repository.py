from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.repositories.base_repository import BaseRepository
from app.models.doctor import Doctor


class DoctorRepository(BaseRepository[Doctor]):
    def __init__(self, db: AsyncSession):
        super().__init__(Doctor, db)

    async def get_by_email(self, email: str) -> Optional[Doctor]:
        result = await self.db.execute(
            select(Doctor).where(
                and_(Doctor.email == email.lower().strip(), Doctor.is_deleted == False)
            )
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        doctor = await self.get_by_email(email)
        return doctor is not None
