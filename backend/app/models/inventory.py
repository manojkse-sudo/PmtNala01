import uuid
from sqlalchemy import String, Text, Integer, Float, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin, SoftDeleteMixin


class InventoryItem(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Medical inventory per doctor — medicines, consumables, equipment.
    doctor_id enforces tenant isolation.
    """
    __tablename__ = "inventory_items"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="general")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="units")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    cost_per_unit: Mapped[float | None] = mapped_column(Float, nullable=True)
    supplier: Mapped[str | None] = mapped_column(String(200), nullable=True)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    doctor = relationship("Doctor", foreign_keys=[doctor_id])

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.reorder_level

    def __repr__(self) -> str:
        return f"<InventoryItem {self.name} qty={self.quantity}>"
