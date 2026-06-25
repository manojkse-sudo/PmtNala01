import uuid
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin, SoftDeleteMixin


class MedicalRecord(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    SOAP-structured medical record tied to a patient visit/appointment.
    doctor_id enforces tenant isolation.
    """
    __tablename__ = "medical_records"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True
    )

    # SOAP Notes
    subjective: Mapped[str | None] = mapped_column(Text, nullable=True)   # Chief complaint, history
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)    # Examination findings
    assessment: Mapped[str | None] = mapped_column(Text, nullable=True)   # Diagnosis
    plan: Mapped[str | None] = mapped_column(Text, nullable=True)         # Treatment plan

    # Structured fields
    diagnosis_codes: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ICD-10 codes
    prescriptions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    lab_orders: Mapped[list | None] = mapped_column(JSON, nullable=True)
    follow_up_days: Mapped[int | None] = mapped_column(nullable=True)

    # Relationships
    doctor = relationship("Doctor", back_populates="medical_records")
    patient = relationship("Patient", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_record")

    def __repr__(self) -> str:
        return f"<MedicalRecord patient={self.patient_id}>"


class Vitals(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Patient vitals recorded per visit."""
    __tablename__ = "vitals"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    medical_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="SET NULL"),
        nullable=True
    )

    # Vitals
    temperature_c: Mapped[float | None] = mapped_column(nullable=True)
    pulse_bpm: Mapped[int | None] = mapped_column(nullable=True)
    bp_systolic: Mapped[int | None] = mapped_column(nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(nullable=True)
    spo2_percent: Mapped[float | None] = mapped_column(nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    height_cm: Mapped[float | None] = mapped_column(nullable=True)
    respiratory_rate: Mapped[int | None] = mapped_column(nullable=True)

    @property
    def bmi(self) -> float | None:
        if self.weight_kg and self.height_cm:
            h = self.height_cm / 100
            return round(self.weight_kg / (h * h), 1)
        return None

    # Relationship
    patient = relationship("Patient", back_populates="vitals")
