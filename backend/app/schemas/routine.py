"""
Pydantic Schemas for Routine operations.

🎓 INTERVIEW CONCEPT: Nested Schemas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you have One-to-Many relationships, you often need
nested schemas for creating parent + children in one request.

Example: Creating a routine with its exercises:
{
    "name": "Push Day",
    "exercises": [
        {"exercise_name": "Bench Press", "target_sets": 4},
        {"exercise_name": "Shoulder Press", "target_sets": 3}
    ]
}
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.routine import DayOfWeek


class RoutineExerciseBase(BaseModel):
    """Base schema for exercises within a routine."""
    exercise_name: str = Field(max_length=100)
    target_sets: int = Field(default=3, ge=1, le=20)
    target_reps: int = Field(default=10, ge=1, le=100)
    target_weight: float | None = Field(default=None, ge=0)
    order: int = Field(default=0, ge=0)
    notes: str | None = None


class RoutineExerciseCreate(RoutineExerciseBase):
    """Schema for creating an exercise within a routine."""
    pass


class RoutineExerciseUpdate(BaseModel):
    """Schema for updating an exercise (all fields optional)."""
    exercise_name: str | None = Field(default=None, max_length=100)
    target_sets: int | None = Field(default=None, ge=1, le=20)
    target_reps: int | None = Field(default=None, ge=1, le=100)
    target_weight: float | None = None
    order: int | None = Field(default=None, ge=0)
    notes: str | None = None


class RoutineExerciseResponse(RoutineExerciseBase):
    """Schema for exercise in API responses."""
    id: int
    routine_id: int
    
    model_config = ConfigDict(from_attributes=True)


class RoutineBase(BaseModel):
    """Base schema for routines."""
    name: str = Field(max_length=100)
    description: str | None = None
    day_of_week: DayOfWeek | None = None


class RoutineCreate(RoutineBase):
    """
    Schema for creating a routine with exercises.
    
    🎓 INTERVIEW: This demonstrates creating a parent
    and its children in a single transaction (atomicity).
    Either all succeed or all fail - no partial state.
    """
    exercises: list[RoutineExerciseCreate] = Field(default_factory=list)


class RoutineUpdate(BaseModel):
    """Schema for updating a routine (all fields optional)."""
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    day_of_week: DayOfWeek | None = None


class RoutineResponse(RoutineBase):
    """
    Schema for routine in API responses.
    
    Includes nested exercises for convenience.
    """
    id: int
    user_id: int
    exercises: list[RoutineExerciseResponse] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RoutineListResponse(BaseModel):
    """Schema for listing routines (without nested exercises for performance)."""
    id: int
    name: str
    description: str | None
    day_of_week: DayOfWeek | None
    exercise_count: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
