"""Authentication endpoints -- login, register, token refresh."""

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
from app.schemas import UserCreate, UserResponse, Token, RefreshTokenRequest

# #region agent log
import json, time as _time
_DEBUG_LOG = "/Users/hienvo/workout_app/.cursor/debug-e83d22.log"
def _dlog(loc, msg, data=None):
    with open(_DEBUG_LOG, "a") as f:
        f.write(json.dumps({"sessionId":"e83d22","location":loc,"message":msg,"data":data or {},"timestamp":int(_time.time()*1000)}) + "\n")
# #endregion

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    # #region agent log
    _dlog("auth.py:register:entry", "register endpoint called", {"email": user_data.email, "username": user_data.username, "hypothesisId": "A"})
    _t0 = _time.time()
    # #endregion
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # #region agent log
    _t1 = _time.time()
    _dlog("auth.py:register:pre-hash", "about to hash password", {"elapsed_check_ms": round((_t1-_t0)*1000), "hypothesisId": "B"})
    # #endregion
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
    )
    # #region agent log
    _t2 = _time.time()
    _dlog("auth.py:register:post-hash", "password hashed", {"hash_ms": round((_t2-_t1)*1000), "total_ms": round((_t2-_t0)*1000), "hypothesisId": "B"})
    # #endregion

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # #region agent log
    _t3 = _time.time()
    _dlog("auth.py:register:done", "register complete", {"total_ms": round((_t3-_t0)*1000), "user_id": user.id, "hypothesisId": "A"})
    # #endregion
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password. Returns access + refresh tokens."""
    # OAuth2PasswordRequestForm uses 'username' field; we treat it as email
    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    # Generic error for both invalid email and password to prevent enumeration
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

    return Token(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get new access token using a refresh token (with token rotation)."""
    payload = decode_token(body.refresh_token)

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

    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return Token(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id),
    )
