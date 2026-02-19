"""Workout session endpoints -- save, list, and retrieve completed workouts."""

from datetime import date

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession
from app.models import DailyLog, WorkoutSession, CompletedSet
from app.schemas.workout import (
    WorkoutSessionCreate,
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
