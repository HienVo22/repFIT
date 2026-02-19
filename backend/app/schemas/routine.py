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
