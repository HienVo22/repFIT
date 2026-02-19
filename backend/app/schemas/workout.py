"""Pydantic schemas for workout session operations."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CompletedSetCreate(BaseModel):
    exercise_name: str = Field(max_length=100)
    set_number: int = Field(ge=1)
    reps_completed: int = Field(ge=0)
    weight_used: float | None = None
    is_completed: bool = True
    notes: str | None = None


class CompletedSetResponse(BaseModel):
    id: int
    workout_session_id: int
    exercise_name: str
    set_number: int
    reps_completed: int
    weight_used: float | None
    is_completed: bool
    completed_at: datetime
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class WorkoutSessionCreate(BaseModel):
    routine_id: int | None = None
    routine_name: str = Field(max_length=100)
    started_at: datetime
    ended_at: datetime
    duration_seconds: int = Field(ge=0)
    notes: str | None = None
    completed_sets: list[CompletedSetCreate] = Field(default_factory=list)


class WorkoutSessionResponse(BaseModel):
    id: int
    daily_log_id: int
    routine_id: int | None
    routine_name: str
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: int | None
    notes: str | None
    completed_sets: list[CompletedSetResponse] = []

    model_config = ConfigDict(from_attributes=True)


class WorkoutSessionListResponse(BaseModel):
    id: int
    routine_name: str
    started_at: datetime
    duration_seconds: int | None
    set_count: int = 0

    model_config = ConfigDict(from_attributes=True)
