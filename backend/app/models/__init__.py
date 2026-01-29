"""
Database Models Export.

🎓 INTERVIEW TIP: Centralized exports make imports cleaner
Instead of: from app.models.user import User
You can do: from app.models import User
"""

from app.models.user import User
from app.models.routine import Routine, RoutineExercise, DayOfWeek
from app.models.daily_log import (
    DailyLog,
    WorkoutSession,
    CompletedSet,
    NutritionLog,
)

__all__ = [
    "User",
    "Routine",
    "RoutineExercise",
    "DayOfWeek",
    "DailyLog",
    "WorkoutSession",
    "CompletedSet",
    "NutritionLog",
]
