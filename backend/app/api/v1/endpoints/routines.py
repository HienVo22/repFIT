"""
Routine Endpoints - CRUD operations for workout routines.

🎓 INTERVIEW CONCEPT: Full CRUD Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This module demonstrates a complete CRUD pattern:
- Create: POST /routines
- Read: GET /routines, GET /routines/{id}
- Update: PATCH /routines/{id}
- Delete: DELETE /routines/{id}

Plus nested resource operations:
- POST /routines/{id}/exercises
- PATCH /routines/{id}/exercises/{exercise_id}
- DELETE /routines/{id}/exercises/{exercise_id}
"""

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
    """
    Create a new routine with optional exercises.
    
    🎓 INTERVIEW CONCEPT: Transactional Consistency
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    This endpoint creates a routine AND its exercises in
    a single database transaction.
    
    If creating any exercise fails, the entire operation
    is rolled back - no partial state.
    
    This is the ACID property "Atomicity":
    All or nothing. Either everything succeeds or nothing does.
    """
    # Create routine
    routine = Routine(
        user_id=current_user.id,
        name=routine_data.name,
        description=routine_data.description,
        day_of_week=routine_data.day_of_week,
    )
    db.add(routine)
    await db.flush()  # Get routine.id without committing
    
    # Create exercises
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
    """
    List all routines for the current user.
    
    🎓 INTERVIEW CONCEPT: Query Optimization
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Note that we use RoutineListResponse which doesn't include
    nested exercises. This is intentional:
    
    1. Listing endpoints should be fast (less data = faster)
    2. If you need exercises, fetch a single routine
    3. N+1 query problem: Loading exercises for each routine
       would be O(n) queries. Better to eager load when needed.
    
    We add exercise_count as a computed field for the UI.
    """
    query = select(Routine).where(Routine.user_id == current_user.id)
    
    if day_of_week:
        query = query.where(Routine.day_of_week == day_of_week)
    
    query = query.order_by(Routine.day_of_week, Routine.name)
    
    result = await db.execute(query)
    routines = result.scalars().all()
    
    # Add exercise count
    # 🎓 INTERVIEW: This could be optimized with a SQL subquery
    # to get counts in a single query. For now, we use lazy loading.
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
    """
    Get a specific routine with all its exercises.
    
    🎓 INTERVIEW CONCEPT: Eager Loading (selectinload)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    We use selectinload to fetch exercises in a single query.
    
    Without it:
    - Query 1: SELECT * FROM routines WHERE id = ?
    - Query 2: SELECT * FROM routine_exercises WHERE routine_id = ?
    
    With selectinload:
    - Both queries run, but SQLAlchemy batches them efficiently
    
    Alternative strategies:
    - joinedload: Single query with JOIN (good for one-to-one)
    - subqueryload: Subquery (good for large child collections)
    """
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
    """
    Update a routine's metadata (not exercises).
    
    Use the exercise-specific endpoints to modify exercises.
    """
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
    """
    Delete a routine and all its exercises.
    
    🎓 INTERVIEW: Cascade delete ensures exercises are
    automatically deleted when the routine is deleted.
    """
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


# ============================================================
# Exercise sub-resource endpoints
# ============================================================

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
    """
    Add an exercise to an existing routine.
    
    🎓 INTERVIEW CONCEPT: Sub-resource Pattern
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    URL: POST /routines/{routine_id}/exercises
    
    This pattern clearly shows the relationship:
    exercises belong to routines.
    
    Alternative flat pattern:
    POST /exercises with routine_id in body
    
    The nested pattern is more RESTful and makes
    authorization easier (verify routine ownership once).
    """
    # Verify routine exists and belongs to user
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
    
    # Get max order to append at end
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
    # Verify routine ownership
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
    
    # Get exercise
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
    # Verify routine ownership
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
    
    # Get and delete exercise
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
