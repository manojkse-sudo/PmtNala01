"""Initial NalaBase schema

Revision ID: 0001
Revises:
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # doctors (tenant root)
    op.create_table(
        'doctors',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('specialty', sa.String(100)),
        sa.Column('license_number', sa.String(100)),
        sa.Column('clinic_name', sa.String(200)),
        sa.Column('clinic_address', sa.Text),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('timezone', sa.String(50), default='UTC', nullable=False),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_doctors_email', 'doctors', ['email'])
    op.create_index('ix_doctors_is_deleted', 'doctors', ['is_deleted'])

    # patients
    op.create_table(
        'patients',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_number', sa.String(50)),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('date_of_birth', sa.Date),
        sa.Column('gender', sa.String(30)),
        sa.Column('blood_group', sa.String(10)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(20)),
        sa.Column('emergency_contact_name', sa.String(200)),
        sa.Column('emergency_contact_phone', sa.String(20)),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('state', sa.String(100)),
        sa.Column('pincode', sa.String(10)),
        sa.Column('allergies', sa.Text),
        sa.Column('chronic_conditions', sa.Text),
        sa.Column('current_medications', sa.Text),
        sa.Column('notes', sa.Text),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_patients_doctor_id', 'patients', ['doctor_id'])
    op.create_index('ix_patients_is_deleted', 'patients', ['is_deleted'])

    # appointments
    op.create_table(
        'appointments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer, default=30, nullable=False),
        sa.Column('status', sa.String(30), default='scheduled', nullable=False),
        sa.Column('appointment_type', sa.String(30), default='consultation', nullable=False),
        sa.Column('chief_complaint', sa.Text),
        sa.Column('notes', sa.Text),
        sa.Column('fee', sa.Integer),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_appointments_doctor_id', 'appointments', ['doctor_id'])
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_scheduled_at', 'appointments', ['scheduled_at'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])

    # medical_records
    op.create_table(
        'medical_records',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('appointment_id', UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='SET NULL')),
        sa.Column('subjective', sa.Text),
        sa.Column('objective', sa.Text),
        sa.Column('assessment', sa.Text),
        sa.Column('plan', sa.Text),
        sa.Column('diagnosis_codes', sa.JSON),
        sa.Column('prescriptions', sa.JSON),
        sa.Column('lab_orders', sa.JSON),
        sa.Column('follow_up_days', sa.Integer),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_medical_records_doctor_id', 'medical_records', ['doctor_id'])
    op.create_index('ix_medical_records_patient_id', 'medical_records', ['patient_id'])

    # vitals
    op.create_table(
        'vitals',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('doctor_id', UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('medical_record_id', UUID(as_uuid=True), sa.ForeignKey('medical_records.id', ondelete='SET NULL')),
        sa.Column('temperature_c', sa.Float),
        sa.Column('pulse_bpm', sa.Integer),
        sa.Column('bp_systolic', sa.Integer),
        sa.Column('bp_diastolic', sa.Integer),
        sa.Column('spo2_percent', sa.Float),
        sa.Column('weight_kg', sa.Float),
        sa.Column('height_cm', sa.Float),
        sa.Column('respiratory_rate', sa.Integer),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_vitals_doctor_id', 'vitals', ['doctor_id'])
    op.create_index('ix_vitals_patient_id', 'vitals', ['patient_id'])


def downgrade() -> None:
    op.drop_table('vitals')
    op.drop_table('medical_records')
    op.drop_table('appointments')
    op.drop_table('patients')
    op.drop_table('doctors')
