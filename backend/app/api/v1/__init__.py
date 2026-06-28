from fastapi import APIRouter
from app.api.v1.endpoints import auth, patients, appointments, records, dashboard, admin, inventory, cases

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(appointments.router)
api_router.include_router(records.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
api_router.include_router(inventory.router)
api_router.include_router(cases.router)
