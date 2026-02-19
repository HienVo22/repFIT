"""Pydantic schemas for nutrition operations."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class NutritionLogCreate(BaseModel):
    raw_input: str = Field(max_length=500)
    calories: float = Field(default=0, ge=0)
    protein_g: float = Field(default=0, ge=0)
    carbs_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)
    fiber_g: float = Field(default=0, ge=0)
    meal_type: str | None = Field(default=None, max_length=50)


class NutritionLogResponse(BaseModel):
    id: int
    daily_log_id: int
    raw_input: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    meal_type: str | None
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyNutritionSummary(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    logs: list[NutritionLogResponse]
