"""Add is_admin to doctors, site_settings table, inventory_items table

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

# Default feature-flag rows inserted on upgrade
DEFAULT_SETTINGS = [
    ("module_appointments", "true",  "Appointments Module",  "Show/hide the Appointments section for doctors"),
    ("module_inventory",    "true",  "Inventory Module",     "Show/hide the Medical Inventory section for doctors"),
    ("module_records",      "true",  "Records Module",       "Show/hide the Medical Records section for doctors"),
]


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    )
    return result.fetchone() is not None


def _table_exists(conn, table: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name = :t"
        ),
        {"t": table},
    )
    return result.fetchone() is not None


def _index_exists(conn, index: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_indexes WHERE indexname = :i"
        ),
        {"i": index},
    )
    return result.fetchone() is not None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Add is_admin column to doctors (safe — skipped if already present)
    if not _column_exists(conn, "doctors", "is_admin"):
        op.add_column(
            "doctors",
            sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        )

    # 2. site_settings — only create if it doesn't already exist
    #    (create_all may have already built it when the backend first started
    #     after the model was added)
    if not _table_exists(conn, "site_settings"):
        op.create_table(
            "site_settings",
            sa.Column("key",         sa.String(100), primary_key=True, nullable=False),
            sa.Column("value",       sa.Text(),      nullable=False, server_default="true"),
            sa.Column("label",       sa.String(200), nullable=True),
            sa.Column("description", sa.Text(),      nullable=True),
            sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at",  sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
        )

    # Seed default settings (INSERT ... ON CONFLICT DO NOTHING is idempotent)
    conn.execute(
        sa.text(
            "INSERT INTO site_settings (key, value, label, description, created_at, updated_at) "
            "VALUES (:key, :value, :label, :description, now(), now()) "
            "ON CONFLICT (key) DO NOTHING"
        ),
        [
            {"key": key, "value": value, "label": label, "description": desc}
            for key, value, label, desc in DEFAULT_SETTINGS
        ],
    )

    # 3. inventory_items — only create if missing
    if not _table_exists(conn, "inventory_items"):
        op.create_table(
            "inventory_items",
            sa.Column("id",            UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column("doctor_id",     UUID(as_uuid=True),
                      sa.ForeignKey("doctors.id", ondelete="CASCADE"),
                      nullable=False),
            sa.Column("name",          sa.String(200), nullable=False),
            sa.Column("category",      sa.String(100), nullable=False, server_default="general"),
            sa.Column("description",   sa.Text(),      nullable=True),
            sa.Column("unit",          sa.String(50),  nullable=False, server_default="units"),
            sa.Column("quantity",      sa.Integer(),   nullable=False, server_default="0"),
            sa.Column("reorder_level", sa.Integer(),   nullable=False, server_default="10"),
            sa.Column("cost_per_unit", sa.Float(),     nullable=True),
            sa.Column("supplier",      sa.String(200), nullable=True),
            sa.Column("batch_number",  sa.String(100), nullable=True),
            sa.Column("expiry_date",   sa.String(20),  nullable=True),
            sa.Column("is_active",     sa.Boolean(),   nullable=False, server_default=sa.true()),
            sa.Column("is_deleted",    sa.Boolean(),   nullable=False, server_default=sa.false()),
            sa.Column("deleted_at",    sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at",    sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
            sa.Column("updated_at",    sa.DateTime(timezone=True), nullable=False,
                      server_default=sa.func.now()),
        )

    if not _index_exists(conn, "ix_inventory_items_doctor_id"):
        op.create_index("ix_inventory_items_doctor_id", "inventory_items", ["doctor_id"])
    if not _index_exists(conn, "ix_inventory_items_is_deleted"):
        op.create_index("ix_inventory_items_is_deleted", "inventory_items", ["is_deleted"])


def downgrade() -> None:
    conn = op.get_bind()
    if _table_exists(conn, "inventory_items"):
        op.drop_table("inventory_items")
    if _table_exists(conn, "site_settings"):
        op.drop_table("site_settings")
    if _column_exists(conn, "doctors", "is_admin"):
        op.drop_column("doctors", "is_admin")
