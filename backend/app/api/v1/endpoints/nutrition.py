"""Nutrition log endpoints -- create, list by date, delete, AI parse."""

import logging
from datetime import date

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.models import DailyLog, NutritionLog
from app.schemas.nutrition import (
    NutritionLogCreate,
    NutritionLogResponse,
    DailyNutritionSummary,
)

logger = logging.getLogger(__name__)

router = APIRouter()


async def _get_or_create_daily_log(db, user_id: int, log_date: date) -> DailyLog:
    result = await db.execute(
        select(DailyLog).where(
            DailyLog.user_id == user_id,
            DailyLog.log_date == log_date,
        )
    )
    daily_log = result.scalar_one_or_none()

    if not daily_log:
        daily_log = DailyLog(user_id=user_id, log_date=log_date)
        db.add(daily_log)
        await db.flush()

    return daily_log


@router.post("/", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
async def create_nutrition_log(
    data: NutritionLogCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Log a nutrition entry for today."""
    today = date.today()
    daily_log = await _get_or_create_daily_log(db, current_user.id, today)

    entry = NutritionLog(
        daily_log_id=daily_log.id,
        raw_input=data.raw_input,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        fiber_g=data.fiber_g,
        meal_type=data.meal_type,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return entry


@router.get("/", response_model=DailyNutritionSummary)
async def get_nutrition_by_date(
    current_user: CurrentUser,
    db: DbSession,
    date_filter: date = Query(alias="date"),
):
    """Get nutrition logs and daily totals for a given date."""
    result = await db.execute(
        select(DailyLog).where(
            DailyLog.user_id == current_user.id,
            DailyLog.log_date == date_filter,
        )
    )
    daily_log = result.scalar_one_or_none()

    if not daily_log:
        return DailyNutritionSummary(
            date=date_filter.isoformat(),
            total_calories=0,
            total_protein_g=0,
            total_carbs_g=0,
            total_fat_g=0,
            logs=[],
        )

    logs = daily_log.nutrition_logs

    return DailyNutritionSummary(
        date=date_filter.isoformat(),
        total_calories=sum(l.calories for l in logs),
        total_protein_g=sum(l.protein_g for l in logs),
        total_carbs_g=sum(l.carbs_g for l in logs),
        total_fat_g=sum(l.fat_g for l in logs),
        logs=logs,
    )


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nutrition_log(
    log_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a nutrition log entry."""
    result = await db.execute(
        select(NutritionLog)
        .join(DailyLog)
        .where(
            NutritionLog.id == log_id,
            DailyLog.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrition log not found",
        )

    await db.delete(entry)
    await db.commit()


# ── AI food parsing ──

class ParseFoodRequest(BaseModel):
    text: str = Field(min_length=2, max_length=500)


class ParsedFoodItem(BaseModel):
    name: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class ParseFoodResponse(BaseModel):
    items: list[ParsedFoodItem]
    raw_text: str


@router.post("/parse", response_model=ParseFoodResponse)
async def parse_food_with_ai(
    data: ParseFoodRequest,
    current_user: CurrentUser,
):
    """Parse a natural language food description into structured items using AI."""
    try:
        from app.services.ai import parse_food_description
        items = await parse_food_description(data.text)
        parsed = [ParsedFoodItem(**item) for item in items]
        return ParseFoodResponse(items=parsed, raw_text=data.text)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("AI food parsing failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse food description: {str(e)[:200]}",
        )
