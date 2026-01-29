"""
FastAPI Dependencies - Reusable dependency injection functions.

🎓 INTERVIEW CONCEPT: Dependency Injection (DI) Pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dependencies are functions that are executed BEFORE your route handler.
They can:
1. Extract and validate data (e.g., JWT token from header)
2. Provide resources (e.g., database session)
3. Enforce authorization (e.g., check user permissions)

FastAPI's DI system provides:
- Automatic request/response handling
- Easy testing (swap dependencies in tests)
- Clear separation of concerns
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models import User

# OAuth2 scheme - extracts Bearer token from Authorization header
# 🎓 INTERVIEW: This creates the "Authorize" button in Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Dependency that extracts and validates the current user from JWT.
    
    🎓 INTERVIEW CONCEPT: Authentication Middleware
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    This dependency:
    1. Extracts JWT from Authorization header
    2. Validates the token signature and expiration
    3. Fetches the user from the database
    4. Raises 401 if any step fails
    
    Usage in routes:
        @router.get("/me")
        async def get_me(user: User = Depends(get_current_user)):
            return user
    
    Time Complexity:
    - Token decode: O(1) - just signature verification
    - DB lookup: O(log n) - indexed by user ID
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode and validate token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    # Extract user ID
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Dependency that ensures the user is active.
    
    🎓 INTERVIEW: This is dependency chaining.
    get_current_active_user depends on get_current_user,
    which depends on oauth2_scheme and get_db.
    
    FastAPI resolves this dependency graph automatically.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


# Type aliases for cleaner route signatures
# 🎓 INTERVIEW: Annotated types make dependencies more readable
CurrentUser = Annotated[User, Depends(get_current_active_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
