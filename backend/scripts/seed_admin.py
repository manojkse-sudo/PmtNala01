"""
Seed the NalaBase admin account and default site settings.

Run from the backend/ directory:
    venv/bin/python scripts/seed_admin.py

The script is idempotent — re-running it is safe.
"""
import asyncio
import sys
import os

# Allow running from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.doctor import Doctor
from app.models.site_settings import SiteSettings
from sqlalchemy import select

ADMIN_EMAIL = "admin@nalabase.com"
ADMIN_PASSWORD = "Admin@NalaBase1"

DEFAULT_SETTINGS = [
    ("module_appointments", "true",  "Appointments Module",  "Show/hide Appointments for doctors"),
    ("module_inventory",    "true",  "Inventory Module",     "Show/hide Inventory for doctors"),
    ("module_records",      "true",  "Records Module",       "Show/hide Medical Records for doctors"),
]


async def seed():
    async with AsyncSessionLocal() as db:
        # 1. Ensure admin doctor exists
        result = await db.execute(select(Doctor).where(Doctor.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            if not existing.is_admin:
                existing.is_admin = True
                await db.commit()
                print(f"[INFO] Upgraded existing account to admin: {ADMIN_EMAIL}")
            else:
                print(f"[INFO] Admin already exists: {ADMIN_EMAIL}")
        else:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            admin = Doctor(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                first_name="NalaBase",
                last_name="Admin",
                is_admin=True,
                is_active=True,
                timezone="UTC",
                created_at=now,
                updated_at=now,
            )
            db.add(admin)
            await db.commit()
            print(f"[OK] Created admin account: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")

        # 2. Seed default settings if missing
        for key, value, label, desc in DEFAULT_SETTINGS:
            result = await db.execute(
                select(SiteSettings).where(SiteSettings.key == key)
            )
            if not result.scalar_one_or_none():
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                db.add(SiteSettings(
                    key=key, value=value, label=label,
                    description=desc, created_at=now, updated_at=now,
                ))
                print(f"[OK] Seeded setting: {key} = {value}")
            else:
                print(f"[SKIP] Setting already exists: {key}")

        await db.commit()
        print("\nSeed complete.")
        print(f"  Admin login: {ADMIN_EMAIL}")
        print(f"  Password:    {ADMIN_PASSWORD}")
        print("\nChange the password after first login via /settings.")


if __name__ == "__main__":
    asyncio.run(seed())
