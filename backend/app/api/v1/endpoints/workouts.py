"""Workout session endpoints -- save, list, retrieve, and AI summary."""

import logging
from datetime import date

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession
from app.models import DailyLog, WorkoutSession, CompletedSet

logger = logging.getLogger(__name__)
from app.schemas.workout import (
    WorkoutSessionCreate,
    WorkoutSessionUpdate,
    WorkoutSessionResponse,
    WorkoutSessionListResponse,
)

router = APIRouter()


async def _get_or_create_daily_log(db, user_id: int, log_date: date) -> DailyLog:
    """Get existing DailyLog for the date, or create one."""
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


@router.post("/", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def save_workout(
    data: WorkoutSessionCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Save a completed workout session with all sets."""
    workout_date = data.started_at.date()
    daily_log = await _get_or_create_daily_log(db, current_user.id, workout_date)

    session = WorkoutSession(
        daily_log_id=daily_log.id,
        routine_id=data.routine_id,
        routine_name=data.routine_name,
        started_at=data.started_at,
        ended_at=data.ended_at,
        duration_seconds=data.duration_seconds,
        notes=data.notes,
    )
    db.add(session)
    await db.flush()

    for s in data.completed_sets:
        completed_set = CompletedSet(
            workout_session_id=session.id,
            exercise_name=s.exercise_name,
            set_number=s.set_number,
            reps_completed=s.reps_completed,
            weight_used=s.weight_used,
            is_completed=s.is_completed,
            notes=s.notes,
        )
        db.add(completed_set)

    await db.commit()
    await db.refresh(session)

    return session


@router.get("/", response_model=list[WorkoutSessionListResponse])
async def list_workouts(
    current_user: CurrentUser,
    db: DbSession,
    date_filter: date | None = Query(default=None, alias="date"),
):
    """List workout sessions for the current user, optionally filtered by date."""
    query = (
        select(WorkoutSession)
        .join(DailyLog)
        .where(DailyLog.user_id == current_user.id)
        .order_by(WorkoutSession.started_at.desc())
    )

    if date_filter:
        query = query.where(DailyLog.log_date == date_filter)

    result = await db.execute(query)
    sessions = result.scalars().all()

    response = []
    for s in sessions:
        response.append(WorkoutSessionListResponse(
            id=s.id,
            routine_name=s.routine_name,
            started_at=s.started_at,
            duration_seconds=s.duration_seconds,
            set_count=len(s.completed_sets),
        ))
    return response


@router.get("/{session_id}", response_model=WorkoutSessionResponse)
async def get_workout(
    session_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get a single workout session with all completed sets."""
    result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.completed_sets))
        .join(DailyLog)
        .where(
            WorkoutSession.id == session_id,
            DailyLog.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout session not found",
        )

    return session


@router.patch("/{session_id}", response_model=WorkoutSessionResponse)
async def update_workout(
    session_id: int,
    data: WorkoutSessionUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a workout session -- add/remove sets, update notes."""
    result = await db.execute(
        select(WorkoutSession)
        .options(selectinload(WorkoutSession.completed_sets))
        .join(DailyLog)
        .where(
            WorkoutSession.id == session_id,
            DailyLog.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout session not found",
        )

    if data.notes is not None:
        session.notes = data.notes

    if data.remove_set_ids:
        for cs in list(session.completed_sets):
            if cs.id in data.remove_set_ids:
                await db.delete(cs)

    for s in data.add_sets:
        db.add(CompletedSet(
            workout_session_id=session.id,
            exercise_name=s.exercise_name,
            set_number=s.set_number,
            reps_completed=s.reps_completed,
            weight_used=s.weight_used,
            is_completed=s.is_completed,
            notes=s.notes,
        ))

    await db.commit()
    await db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    session_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a workout session."""
    result = await db.execute(
        select(WorkoutSession)
        .join(DailyLog)
        .where(
            WorkoutSession.id == session_id,
            DailyLog.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout session not found",
        )

    await db.delete(session)
    await db.commit()


# ── AI Workout Summary ──

class WorkoutSummaryRequest(BaseModel):
    routine_name: str
    duration_seconds: int
    completed_sets: list[dict]


class WorkoutSummaryResponse(BaseModel):
    summary: str
    tips: list[str]


@router.post("/summary", response_model=WorkoutSummaryResponse)
async def get_workout_ai_summary(
    data: WorkoutSummaryRequest,
    current_user: CurrentUser,
):
    """Get an AI-generated summary and tips for a completed workout."""
    try:
        from app.services.ai import get_workout_summary
        result = await get_workout_summary(data.model_dump())
        return WorkoutSummaryResponse(**result)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("AI workout summary failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate workout summary: {str(e)[:200]}",
        )
