"""
User Endpoints - Profile management.

🎓 INTERVIEW CONCEPT: RESTful Resource Design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REST uses HTTP methods to define operations:
- GET /users/me     -> Read current user
- PATCH /users/me   -> Partial update
- DELETE /users/me  -> Delete account

The /me endpoint is a common pattern for "current user"
operations without needing to know the user ID.
"""

from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser, DbSession
from app.core.security import hash_password
from app.schemas import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: CurrentUser,
):
    """
    Get current authenticated user's profile.
    
    🎓 INTERVIEW: This endpoint is very simple because
    all the work happens in the CurrentUser dependency.
    This is the power of dependency injection!
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Update current user's profile.
    
    🎓 INTERVIEW CONCEPT: Partial Updates (PATCH vs PUT)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    - PATCH: Update only the fields provided
    - PUT: Replace the entire resource
    
    We use model.model_dump(exclude_unset=True) to get only
    the fields that were explicitly set in the request.
    
    Example:
        Request: {"full_name": "John"}
        Result: Only full_name is updated, other fields unchanged
    """
    # Get only fields that were explicitly provided
    update_data = user_update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    
    # Handle password separately (needs hashing)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    
    # Update user fields
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Delete current user's account.
    
    🎓 INTERVIEW CONCEPT: Cascading Deletes
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Because we defined cascade="all, delete-orphan" on
    the User relationships, deleting a user automatically
    deletes their routines, logs, etc.
    
    This is handled at the ORM level. Alternatively, you
    could use ON DELETE CASCADE at the database level.
    
    For some apps, you might want "soft delete" instead:
    - Set is_active=False
    - Keep data for analytics/compliance
    - Allow account recovery
    """
    await db.delete(current_user)
    await db.commit()
