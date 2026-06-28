from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin


class SiteSettings(Base, TimestampMixin):
    """
    Global key-value feature flags and configuration.
    Keys like 'module_appointments', 'module_inventory' control sidebar visibility.
    Value is always a JSON string (e.g. "true" / "false" / "\"some string\"").
    """
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="true")
    label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<SiteSettings {self.key}={self.value}>"
