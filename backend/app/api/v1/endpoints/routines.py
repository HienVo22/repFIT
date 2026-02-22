"""Routine CRUD endpoints, including nested exercise sub-resources."""

import logging
import random

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession
from app.models import Routine, RoutineExercise, DayOfWeek

logger = logging.getLogger(__name__)
from app.schemas import (
    RoutineCreate,
    RoutineUpdate,
    RoutineResponse,
    RoutineListResponse,
    RoutineExerciseCreate,
    RoutineExerciseUpdate,
    RoutineExerciseResponse,
)
from app.schemas.routine import (
    GenerateRoutineRequest,
    GenerateRoutineResponse,
    GeneratedDay,
    GeneratedExercise,
    AvailableSplitsResponse,
    AvailableSplit,
)
from app.data.exercises import (
    SPLIT_TEMPLATES,
    INTENSITY_PRESETS,
    DAYS_OF_WEEK,
    get_exercises_by_muscle,
)

router = APIRouter()


@router.get("/splits", response_model=AvailableSplitsResponse)
async def get_available_splits(days: int = Query(default=0, ge=0, le=7)):
    """Return available workout splits, optionally filtered by number of training days."""
    splits = []
    for key, tmpl in SPLIT_TEMPLATES.items():
        if days > 0 and not (tmpl["min_days"] <= days <= tmpl["max_days"]):
            continue
        splits.append(AvailableSplit(
            key=key,
            label=tmpl["label"],
            min_days=tmpl["min_days"],
            max_days=tmpl["max_days"],
            day_names=[d["name"] for d in tmpl["days"]],
        ))
    return AvailableSplitsResponse(splits=splits)


@router.post("/generate", response_model=GenerateRoutineResponse)
async def generate_routine(data: GenerateRoutineRequest):
    """Generate a routine preview based on split type, days, and intensity. Not saved."""
    template = SPLIT_TEMPLATES.get(data.split_type)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown split type: {data.split_type}",
        )

    preset = INTENSITY_PRESETS.get(data.intensity)
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown intensity: {data.intensity}",
        )

    reps_label = f"{preset['reps_min']}-{preset['reps_max']}"
    base_days = template["days"]

    # For 6-day PPL / Arnold, repeat the cycle twice
    if data.days_per_week >= 6 and len(base_days) == 3:
        schedule_days = base_days * 2
    else:
        schedule_days = base_days[:data.days_per_week]

    generated_days: list[GeneratedDay] = []
    for idx, day_template in enumerate(schedule_days):
        exercises: list[GeneratedExercise] = []
        order = 0
        for muscle_group, count in day_template["muscles"]:
            pool = get_exercises_by_muscle(muscle_group)
            random.shuffle(pool)
            selected = pool[:count]
            for ex in selected:
                exercises.append(GeneratedExercise(
                    exercise_name=ex["name"],
                    muscle_group=ex["muscle_group"],
                    target_sets=preset["sets"],
                    target_reps=reps_label,
                    equipment=ex["equipment"],
                    order=order,
                ))
                order += 1

        day_of_week = DAYS_OF_WEEK[idx] if idx < 7 else DAYS_OF_WEEK[idx % 7]
        suffix = f" (Day {idx + 1})" if len(schedule_days) > len(base_days) else ""
        generated_days.append(GeneratedDay(
            name=f"{day_template['name']}{suffix}",
            day_of_week=day_of_week,
            exercises=exercises,
        ))

    return GenerateRoutineResponse(
        split_type=data.split_type,
        split_label=template["label"],
        intensity=data.intensity,
        days=generated_days,
    )


class CoachNotesRequest(BaseModel):
    routine_data: dict


class CoachNotesResponse(BaseModel):
    tips: list[str]


@router.post("/coach-notes", response_model=CoachNotesResponse)
async def get_ai_coach_notes(data: CoachNotesRequest):
    """Get AI-generated coaching tips for a routine."""
    try:
        from app.services.ai import get_coach_notes
        tips = await get_coach_notes(data.routine_data)
        return CoachNotesResponse(tips=tips)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("AI coach notes failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate coach notes: {str(e)[:200]}",
        )


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_routine(
    routine_data: RoutineCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new routine with optional exercises in a single transaction."""
    routine = Routine(
        user_id=current_user.id,
        name=routine_data.name,
        description=routine_data.description,
        day_of_week=routine_data.day_of_week,
    )
    db.add(routine)
    await db.flush()

    for i, exercise_data in enumerate(routine_data.exercises):
        exercise = RoutineExercise(
            routine_id=routine.id,
            exercise_name=exercise_data.exercise_name,
            target_sets=exercise_data.target_sets,
            target_reps=exercise_data.target_reps,
            target_weight=exercise_data.target_weight,
            order=exercise_data.order if exercise_data.order else i,
            notes=exercise_data.notes,
        )
        db.add(exercise)

    await db.commit()
    await db.refresh(routine)

    return routine


@router.get("/", response_model=list[RoutineListResponse])
async def list_routines(
    current_user: CurrentUser,
    db: DbSession,
    day_of_week: DayOfWeek | None = None,
):
    """List all routines for the current user."""
    query = select(Routine).where(Routine.user_id == current_user.id)

    if day_of_week:
        query = query.where(Routine.day_of_week == day_of_week)

    day_order = case(
        (Routine.day_of_week == "monday", 0),
        (Routine.day_of_week == "tuesday", 1),
        (Routine.day_of_week == "wednesday", 2),
        (Routine.day_of_week == "thursday", 3),
        (Routine.day_of_week == "friday", 4),
        (Routine.day_of_week == "saturday", 5),
        (Routine.day_of_week == "sunday", 6),
        else_=7,
    )
    query = query.order_by(day_order, Routine.name)

    result = await db.execute(query)
    routines = result.scalars().all()

    response = []
    for routine in routines:
        routine_dict = {
            "id": routine.id,
            "name": routine.name,
            "description": routine.description,
            "day_of_week": routine.day_of_week,
            "created_at": routine.created_at,
            "exercise_count": len(routine.exercises),
        }
        response.append(RoutineListResponse(**routine_dict))

    return response


@router.get("/{routine_id}", response_model=RoutineResponse)
async def get_routine(
    routine_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get a specific routine with all its exercises."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id, Routine.user_id == current_user.id)
    )
    routine = result.scalar_one_or_none()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    return routine


@router.patch("/{routine_id}", response_model=RoutineResponse)
async def update_routine(
    routine_id: int,
    routine_update: RoutineUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a routine's metadata (not exercises)."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id, Routine.user_id == current_user.id)
    )
    routine = result.scalar_one_or_none()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    update_data = routine_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(routine, field, value)

    await db.commit()
    await db.refresh(routine)

    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(
    routine_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a routine and all its exercises."""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    routine = result.scalar_one_or_none()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    await db.delete(routine)
    await db.commit()


# ── Exercise sub-resource endpoints ──


@router.post(
    "/{routine_id}/exercises",
    response_model=RoutineExerciseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_exercise_to_routine(
    routine_id: int,
    exercise_data: RoutineExerciseCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Add an exercise to an existing routine."""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    routine = result.scalar_one_or_none()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    result = await db.execute(
        select(func.max(RoutineExercise.order))
        .where(RoutineExercise.routine_id == routine_id)
    )
    max_order = result.scalar() or -1

    exercise = RoutineExercise(
        routine_id=routine_id,
        exercise_name=exercise_data.exercise_name,
        target_sets=exercise_data.target_sets,
        target_reps=exercise_data.target_reps,
        target_weight=exercise_data.target_weight,
        order=exercise_data.order if exercise_data.order else max_order + 1,
        notes=exercise_data.notes,
    )

    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)

    return exercise


@router.patch(
    "/{routine_id}/exercises/{exercise_id}",
    response_model=RoutineExerciseResponse,
)
async def update_exercise(
    routine_id: int,
    exercise_id: int,
    exercise_update: RoutineExerciseUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update an exercise within a routine."""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    result = await db.execute(
        select(RoutineExercise).where(
            RoutineExercise.id == exercise_id,
            RoutineExercise.routine_id == routine_id,
        )
    )
    exercise = result.scalar_one_or_none()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    update_data = exercise_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    await db.commit()
    await db.refresh(exercise)

    return exercise


@router.delete(
    "/{routine_id}/exercises/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_exercise(
    routine_id: int,
    exercise_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete an exercise from a routine."""
    result = await db.execute(
        select(Routine).where(
            Routine.id == routine_id,
            Routine.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found",
        )

    result = await db.execute(
        select(RoutineExercise).where(
            RoutineExercise.id == exercise_id,
            RoutineExercise.routine_id == routine_id,
        )
    )
    exercise = result.scalar_one_or_none()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    await db.delete(exercise)
    await db.commit()
