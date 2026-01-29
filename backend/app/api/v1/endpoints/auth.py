"""
Authentication Endpoints - Login, Register, Token Refresh.

🎓 INTERVIEW CONCEPT: OAuth2 Password Flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The OAuth2 "password" grant type:
1. User sends username/password
2. Server validates credentials
3. Server returns access + refresh tokens
4. Client uses access token for API calls
5. Client uses refresh token to get new access token

This is suitable for first-party apps where you trust
the client with the user's credentials.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models import User
from app.schemas import UserCreate, UserResponse, Token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    
    🎓 INTERVIEW CONCEPT: Idempotency & Uniqueness
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    We check for existing email/username BEFORE attempting insert.
    This provides a better error message than a DB constraint violation.
    
    However, there's a race condition:
    - Thread 1: Check email -> not found
    - Thread 2: Check email -> not found
    - Thread 1: Insert -> success
    - Thread 2: Insert -> DB error (unique constraint)
    
    The DB unique constraint is our safety net.
    For high-traffic systems, consider pessimistic locking.
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if username already exists
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    # Create new user
    # 🎓 INTERVIEW: Never store plain passwords!
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email and password.
    
    🎓 INTERVIEW CONCEPT: Timing Attacks Prevention
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Notice we use a generic error message regardless of whether
    the email exists or the password is wrong.
    
    Why? An attacker could:
    1. Try login with "alice@example.com" -> "Invalid password"
       (Now they know Alice has an account!)
    2. Try login with "bob@example.com" -> "User not found"
       (Now they know Bob doesn't have an account)
    
    This is called "user enumeration" and it's a security risk.
    Always return the same error for both cases.
    """
    # OAuth2PasswordRequestForm uses 'username' field, but we use email
    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    # Generic error message for both invalid email and password
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not user:
        raise invalid_credentials
    
    if not verify_password(form_data.password, user.hashed_password):
        raise invalid_credentials
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    
    # Generate tokens
    return Token(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get new access token using refresh token.
    
    🎓 INTERVIEW CONCEPT: Token Refresh Flow
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    1. Access token expires (e.g., after 30 minutes)
    2. Client sends refresh token to this endpoint
    3. Server validates refresh token
    4. Server issues new access + refresh tokens
    
    Security consideration: We also issue a new refresh token.
    This is called "token rotation" and limits the damage if
    a refresh token is stolen.
    """
    payload = decode_token(refresh_token)
    
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Verify user still exists and is active
    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Issue new tokens
    return Token(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id),
    )
