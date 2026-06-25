from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin, SoftDeleteMixin


class Doctor(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    The Doctor is the tenant root. Every other entity belongs to a doctor.
    Row-level security is enforced at the service/repository layer via doctor_id.
    """
    __tablename__ = "doctors"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    clinic_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    clinic_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)

    # Relationships
    patients = relationship("Patient", back_populates="doctor", lazy="noload")
    appointments = relationship("Appointment", back_populates="doctor", lazy="noload")
    medical_records = relationship("MedicalRecord", back_populates="doctor", lazy="noload")

    @property
    def full_name(self) -> str:
        return f"Dr. {self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Doctor {self.email}>"
