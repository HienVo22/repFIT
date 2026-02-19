"""Routine CRUD endpoints, including nested exercise sub-resources."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession
from app.models import Routine, RoutineExercise, DayOfWeek
from app.schemas import (
    RoutineCreate,
    RoutineUpdate,
    RoutineResponse,
    RoutineListResponse,
    RoutineExerciseCreate,
    RoutineExerciseUpdate,
    RoutineExerciseResponse,
)

router = APIRouter()


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

    query = query.order_by(Routine.day_of_week, Routine.name)

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
