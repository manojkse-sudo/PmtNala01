from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryListResponse, InventoryItemResponse
from app.models.inventory import InventoryItem


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.repo = InventoryRepository(db)

    async def list_items(
        self,
        doctor_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        category: str | None = None,
        low_stock_only: bool = False,
    ) -> InventoryListResponse:
        items, total = await self.repo.list_for_doctor(
            doctor_id, skip, limit, search, category, low_stock_only
        )
        low_stock_count = await self.repo.count_low_stock(doctor_id)
        return InventoryListResponse(
            items=[InventoryItemResponse.model_validate(i) for i in items],
            total=total,
            low_stock_count=low_stock_count,
        )

    async def create_item(self, doctor_id: UUID, data: InventoryItemCreate) -> InventoryItem:
        return await self.repo.create(doctor_id=doctor_id, **data.model_dump())

    async def update_item(self, item_id: UUID, doctor_id: UUID, data: InventoryItemUpdate) -> InventoryItem:
        item = await self.repo.get_for_doctor(item_id, doctor_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return await self.repo.update(item, **data.model_dump(exclude_unset=True))

    async def delete_item(self, item_id: UUID, doctor_id: UUID) -> None:
        item = await self.repo.get_for_doctor(item_id, doctor_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        await self.repo.soft_delete(item)

    async def adjust_quantity(self, item_id: UUID, doctor_id: UUID, delta: int) -> InventoryItem:
        item = await self.repo.get_for_doctor(item_id, doctor_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        new_qty = max(0, item.quantity + delta)
        return await self.repo.update(item, quantity=new_qty)
