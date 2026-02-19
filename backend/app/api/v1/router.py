"""API v1 router -- aggregates all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, routines, workouts, nutrition, calendar

api_router = APIRouter()

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    routines.router,
    prefix="/routines",
    tags=["Routines"],
)

api_router.include_router(
    workouts.router,
    prefix="/workouts",
    tags=["Workouts"],
)

api_router.include_router(
    nutrition.router,
    prefix="/nutrition",
    tags=["Nutrition"],
)

api_router.include_router(
    calendar.router,
    prefix="/calendar",
    tags=["Calendar"],
)
