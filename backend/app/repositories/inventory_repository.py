from typing import List, Optional, Sequence
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.inventory import InventoryItem
from app.repositories.base_repository import BaseRepository


class InventoryRepository(BaseRepository[InventoryItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(InventoryItem, db)

    async def list_for_doctor(
        self,
        doctor_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        category: Optional[str] = None,
        low_stock_only: bool = False,
    ) -> tuple[Sequence[InventoryItem], int]:
        base = and_(
            InventoryItem.doctor_id == doctor_id,
            InventoryItem.is_deleted == False,
        )
        filters = [base]
        if search:
            filters.append(InventoryItem.name.ilike(f"%{search}%"))
        if category:
            filters.append(InventoryItem.category == category)
        if low_stock_only:
            filters.append(InventoryItem.quantity <= InventoryItem.reorder_level)

        q = select(InventoryItem).where(and_(*filters))
        total_result = await self.db.execute(
            select(func.count()).select_from(q.subquery())
        )
        total = total_result.scalar_one()

        result = await self.db.execute(
            q.order_by(InventoryItem.name).offset(skip).limit(limit)
        )
        return result.scalars().all(), total

    async def get_for_doctor(self, item_id: UUID, doctor_id: UUID) -> Optional[InventoryItem]:
        result = await self.db.execute(
            select(InventoryItem).where(
                and_(
                    InventoryItem.id == item_id,
                    InventoryItem.doctor_id == doctor_id,
                    InventoryItem.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()

    async def count_low_stock(self, doctor_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count(InventoryItem.id)).where(
                and_(
                    InventoryItem.doctor_id == doctor_id,
                    InventoryItem.is_deleted == False,
                    InventoryItem.quantity <= InventoryItem.reorder_level,
                )
            )
        )
        return result.scalar_one()
