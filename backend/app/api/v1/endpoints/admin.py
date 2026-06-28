from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.admin_service import AdminService
from app.schemas.admin import (
    SiteSettingResponse, SiteSettingsMap,
    AdminDoctorCreate, AdminDoctorUpdate, AdminDoctorResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_doctor=Depends(get_current_doctor)):
    if not current_doctor.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_doctor


# ── Site Settings ─────────────────────────────────────────────────────────────

@router.get("/settings", response_model=SiteSettingsMap)
async def get_settings(
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all site settings as a flat key->value map."""
    svc = AdminService(db)
    settings = await svc.get_settings()
    return SiteSettingsMap(settings=settings)


@router.patch("/settings", response_model=SiteSettingsMap)
async def update_settings(
    updates: dict[str, str],
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Bulk-update site settings. Pass only keys you want to change."""
    svc = AdminService(db)
    settings = await svc.update_settings(updates)
    await db.commit()
    return SiteSettingsMap(settings=settings)


# ── Public settings endpoint (no admin required — frontend reads this) ────────

@router.get("/settings/public", response_model=SiteSettingsMap)
async def get_public_settings(
    _=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Any authenticated doctor can read module visibility settings."""
    from app.repositories.site_settings_repository import SiteSettingsRepository
    repo = SiteSettingsRepository(db)
    return SiteSettingsMap(settings=await repo.get_map())


# ── Doctor Management ─────────────────────────────────────────────────────────

@router.get("/doctors", response_model=List[AdminDoctorResponse])
async def list_doctors(
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all doctor accounts."""
    svc = AdminService(db)
    return await svc.list_doctors()


@router.post("/doctors", response_model=AdminDoctorResponse, status_code=201)
async def create_doctor(
    data: AdminDoctorCreate,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a new doctor account."""
    svc = AdminService(db)
    doctor = await svc.create_doctor(data)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.patch("/doctors/{doctor_id}", response_model=AdminDoctorResponse)
async def update_doctor(
    doctor_id: UUID,
    data: AdminDoctorUpdate,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin updates doctor details or toggles is_active / is_admin."""
    svc = AdminService(db)
    doctor = await svc.update_doctor(doctor_id, data)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.delete("/doctors/{doctor_id}", status_code=204)
async def deactivate_doctor(
    doctor_id: UUID,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate (soft-disable) a doctor account."""
    svc = AdminService(db)
    await svc.deactivate_doctor(doctor_id)
    await db.commit()
