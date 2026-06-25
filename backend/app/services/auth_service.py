from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.doctor_repository import DoctorRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.doctor import DoctorRegister, DoctorLogin, TokenResponse, DoctorResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DoctorRepository(db)

    async def register(self, data: DoctorRegister) -> TokenResponse:
        if await self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        doctor = await self.repo.create(
            email=data.email.lower().strip(),
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            specialty=data.specialty,
            clinic_name=data.clinic_name,
            license_number=data.license_number,
        )
        return self._build_token_response(doctor)

    async def login(self, data: DoctorLogin) -> TokenResponse:
        doctor = await self.repo.get_by_email(data.email)
        if not doctor or not verify_password(data.password, doctor.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not doctor.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Contact support.",
            )
        return self._build_token_response(doctor)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        doctor_id = payload.get("sub")
        from uuid import UUID
        doctor = await self.repo.get_by_id(UUID(doctor_id))
        if not doctor:
            raise HTTPException(status_code=401, detail="Doctor not found")
        return self._build_token_response(doctor)

    def _build_token_response(self, doctor) -> TokenResponse:
        subject = str(doctor.id)
        return TokenResponse(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
            doctor=DoctorResponse.model_validate(doctor),
        )
