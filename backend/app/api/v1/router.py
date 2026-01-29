"""
API v1 Router - Aggregates all endpoint routers.

🎓 INTERVIEW CONCEPT: Router Organization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organizing routes into separate files:
1. Keeps each file focused and manageable
2. Enables parallel development (different devs on different features)
3. Makes testing easier (can test routes in isolation)

URL structure follows REST conventions:
- /auth     - Authentication (login, register, refresh)
- /users    - User management
- /routines - Workout routine CRUD
- /workouts - Active workout sessions
- /nutrition - Food logging
- /calendar - Calendar view data
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, routines

api_router = APIRouter()

# Include all endpoint routers
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

# TODO: Add these as you implement them
# api_router.include_router(workouts.router, prefix="/workouts", tags=["Workouts"])
# api_router.include_router(nutrition.router, prefix="/nutrition", tags=["Nutrition"])
# api_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
