from typing import Generic, TypeVar, Type, Optional, List, Any, Sequence
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.orm import DeclarativeBase

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Generic async repository implementing CRUD with soft-delete support.
    All multi-tenant repos extend this and add doctor_id filtering.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model).where(
                and_(self.model.id == id, self.model.is_deleted == False)
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> Sequence[ModelType]:
        result = await self.db.execute(
            select(self.model)
            .where(self.model.is_deleted == False)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ModelType, **kwargs) -> ModelType:
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        instance.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def soft_delete(self, instance: ModelType) -> ModelType:
        instance.is_deleted = True
        instance.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        return instance

    async def count(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(self.model.id)).where(self.model.is_deleted == False)
        )
        return result.scalar_one()
