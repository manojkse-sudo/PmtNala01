from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class InventoryItemCreate(BaseModel):
    name: str
    category: str = "general"
    description: Optional[str] = None
    unit: str = "units"
    quantity: int = 0
    reorder_level: int = 10
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = None


class InventoryItemResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    name: str
    category: str
    description: Optional[str] = None
    unit: str
    quantity: int
    reorder_level: int
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: bool
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryListResponse(BaseModel):
    items: list[InventoryItemResponse]
    total: int
    low_stock_count: int
