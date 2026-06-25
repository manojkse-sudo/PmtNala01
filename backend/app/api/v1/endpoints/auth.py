from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.services.auth_service import AuthService
from app.schemas.doctor import (
    DoctorRegister, DoctorLogin, TokenResponse,
    DoctorResponse, DoctorUpdate, RefreshRequest
)
from app.repositories.doctor_repository import DoctorRepository

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: DoctorRegister, db: AsyncSession = Depends(get_db)):
    """Register a new doctor account (creates a new tenant)."""
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: DoctorLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    service = AuthService(db)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Get a new access token using refresh token."""
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=DoctorResponse)
async def get_me(current_doctor=Depends(get_current_doctor)):
    """Get the currently authenticated doctor's profile."""
    return DoctorResponse.model_validate(current_doctor)


@router.patch("/me", response_model=DoctorResponse)
async def update_me(
    data: DoctorUpdate,
    current_doctor=Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Update the current doctor's profile."""
    repo = DoctorRepository(db)
    updated = await repo.update(current_doctor, **data.model_dump(exclude_unset=True))
    return DoctorResponse.model_validate(updated)
