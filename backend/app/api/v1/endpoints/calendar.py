"""Calendar endpoint -- returns activity indicators for a given month."""

from datetime import date

from fastapi import APIRouter, Query
from sqlalchemy import select, extract, and_

from app.core.dependencies import CurrentUser, DbSession
from app.models import DailyLog, WorkoutSession, NutritionLog

router = APIRouter()


@router.get("/")
async def get_calendar_data(
    current_user: CurrentUser,
    db: DbSession,
    month: str = Query(description="YYYY-MM format"),
):
    """Return dates with workout/nutrition activity for a given month.

    Response format:
    [
      {"date": "2026-02-01", "has_workout": true, "has_nutrition": false},
      ...
    ]
    """
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
