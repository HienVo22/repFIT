"""Calendar endpoint -- returns activity indicators for a given month."""

from datetime import date

from fastapi import APIRouter, Query
from sqlalchemy import select, extract

from app.core.dependencies import CurrentUser, DbSession
from app.models import DailyLog, WorkoutSession, NutritionLog

router = APIRouter()


@router.get("/")
async def get_calendar_data(
    current_user: CurrentUser,
    db: DbSession,
    month: str = Query(description="YYYY-MM format"),
):
    """Return dates with workout/nutrition activity for a given month."""
    try:
        year, month_num = map(int, month.split("-"))
    except (ValueError, AttributeError):
        return []

    result = await db.execute(
        select(DailyLog).where(
            DailyLog.user_id == current_user.id,
            extract("year", DailyLog.log_date) == year,
            extract("month", DailyLog.log_date) == month_num,
        )
    )
    daily_logs = result.scalars().all()

    days = []
    for log in daily_logs:
        days.append({
            "date": log.log_date.isoformat(),
            "has_workout": len(log.workout_sessions) > 0,
            "has_nutrition": len(log.nutrition_logs) > 0,
        })

    return days


@router.get("/day")
async def get_day_detail(
    current_user: CurrentUser,
    db: DbSession,
    date_str: str = Query(alias="date", description="YYYY-MM-DD format"),
):
    """Return detailed workout sessions and nutrition data for a specific date."""
    try:
        target_date = date.fromisoformat(date_str)
    except (ValueError, TypeError):
        return {"date": date_str, "workouts": [], "nutrition": {"meals": [], "totals": {}}}

    result = await db.execute(
        select(DailyLog).where(
            DailyLog.user_id == current_user.id,
            DailyLog.log_date == target_date,
        )
    )
    daily_log = result.scalar_one_or_none()

    if not daily_log:
        return {
            "date": date_str,
            "workouts": [],
            "nutrition": {
                "meals": [],
                "totals": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0},
            },
        }

    workouts = []
    for session in daily_log.workout_sessions:
        sets_count = len(session.completed_sets) if session.completed_sets else 0
        workouts.append({
            "id": session.id,
            "routine_name": session.routine_name,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "duration_seconds": session.duration_seconds,
            "sets_completed": sets_count,
        })

    meals = []
    total_cal = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0

    for log in daily_log.nutrition_logs:
        meals.append({
            "id": log.id,
            "raw_input": log.raw_input,
            "calories": log.calories,
            "protein_g": log.protein_g,
            "carbs_g": log.carbs_g,
            "fat_g": log.fat_g,
            "logged_at": log.logged_at.isoformat() if log.logged_at else None,
        })
        total_cal += log.calories
        total_protein += log.protein_g
        total_carbs += log.carbs_g
        total_fat += log.fat_g

    return {
        "date": date_str,
        "workouts": workouts,
        "nutrition": {
            "meals": meals,
            "totals": {
                "calories": round(total_cal),
                "protein_g": round(total_protein),
                "carbs_g": round(total_carbs),
                "fat_g": round(total_fat),
            },
        },
    }
