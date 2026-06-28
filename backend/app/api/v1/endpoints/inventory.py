from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.inventory_service import InventoryService
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate,
    InventoryItemResponse, InventoryListResponse,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=InventoryListResponse)
async def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    svc = InventoryService(db)
    return await svc.list_items(
        current_doctor.id, skip, limit, search, category, low_stock_only
    )


@router.post("", response_model=InventoryItemResponse, status_code=201)
async def create_item(
    data: InventoryItemCreate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    svc = InventoryService(db)
    item = await svc.create_item(current_doctor.id, data)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=InventoryItemResponse)
async def update_item(
    item_id: UUID,
    data: InventoryItemUpdate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    svc = InventoryService(db)
    item = await svc.update_item(item_id, current_doctor.id, data)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/{item_id}/adjust", response_model=InventoryItemResponse)
async def adjust_quantity(
    item_id: UUID,
    delta: int,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Add (positive delta) or remove (negative delta) stock."""
    svc = InventoryService(db)
    item = await svc.adjust_quantity(item_id, current_doctor.id, delta)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: UUID,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    svc = InventoryService(db)
    await svc.delete_item(item_id, current_doctor.id)
    await db.commit()
