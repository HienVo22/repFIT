"""Pydantic schemas for routine operations."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.routine import DayOfWeek


class RoutineExerciseBase(BaseModel):
    exercise_name: str = Field(max_length=100)
    target_sets: int = Field(default=3, ge=1, le=20)
    target_reps: int = Field(default=10, ge=1, le=100)
    target_weight: float | None = Field(default=None, ge=0)
    order: int = Field(default=0, ge=0)
    notes: str | None = None


class RoutineExerciseCreate(RoutineExerciseBase):
    pass


class RoutineExerciseUpdate(BaseModel):
    exercise_name: str | None = Field(default=None, max_length=100)
    target_sets: int | None = Field(default=None, ge=1, le=20)
    target_reps: int | None = Field(default=None, ge=1, le=100)
    target_weight: float | None = None
    order: int | None = Field(default=None, ge=0)
    notes: str | None = None


class RoutineExerciseResponse(RoutineExerciseBase):
    id: int
    routine_id: int

    model_config = ConfigDict(from_attributes=True)


class RoutineBase(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = None
    day_of_week: DayOfWeek | None = None


class RoutineCreate(RoutineBase):
    exercises: list[RoutineExerciseCreate] = Field(default_factory=list)


class RoutineUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    day_of_week: DayOfWeek | None = None


class RoutineResponse(RoutineBase):
    id: int
    user_id: int
    exercises: list[RoutineExerciseResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineListResponse(BaseModel):
    id: int
    name: str
    description: str | None
    day_of_week: DayOfWeek | None
    exercise_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Routine generation schemas ──

class GenerateRoutineRequest(BaseModel):
    days_per_week: int = Field(ge=1, le=7)
    split_type: str = Field(max_length=50)
    intensity: str = Field(max_length=50)


class GeneratedExercise(BaseModel):
    exercise_name: str
    muscle_group: str
    target_sets: int
    target_reps: str
    equipment: str
    order: int


class GeneratedDay(BaseModel):
    name: str
    day_of_week: str
    exercises: list[GeneratedExercise]


class GenerateRoutineResponse(BaseModel):
    split_type: str
    split_label: str
    intensity: str
    days: list[GeneratedDay]


class AvailableSplit(BaseModel):
    key: str
    label: str
    min_days: int
    max_days: int
    day_names: list[str]


class AvailableSplitsResponse(BaseModel):
    splits: list[AvailableSplit]
