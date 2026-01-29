"""
Security utilities: Password hashing and JWT tokens.

🎓 INTERVIEW CONCEPT: Authentication vs Authorization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Authentication: "Who are you?" (handled by JWT tokens)
- Authorization: "What can you do?" (handled by roles/permissions)

This module handles Authentication. We use:
1. bcrypt for password hashing (one-way, with salt)
2. JWT (JSON Web Tokens) for stateless auth

🎓 Why Stateless JWT over Sessions?
- No server-side storage needed (scales horizontally)
- Mobile apps can store token locally
- Each request is self-contained
- Trade-off: Can't invalidate tokens easily (use short expiry + refresh tokens)
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# Password hashing context
# 🎓 INTERVIEW: bcrypt automatically handles salting
# Salt = random data added before hashing to prevent rainbow table attacks
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    🎓 INTERVIEW CONCEPT: Why bcrypt?
    1. Intentionally slow (prevents brute force attacks)
    2. Built-in salting (each hash is unique even for same password)
    3. Configurable work factor (can increase as hardware improves)
    
    Time Complexity: O(2^work_factor) - intentionally expensive!
    Default work factor = 12, meaning 2^12 = 4096 iterations
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    🎓 SECURITY NOTE: This uses constant-time comparison
    to prevent timing attacks (attacker can't determine
    how many characters matched based on response time).
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str | int,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a JWT access token.
    
    🎓 INTERVIEW CONCEPT: JWT Structure
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    JWT = Header.Payload.Signature (base64 encoded, dot-separated)
    
    Header: {"alg": "HS256", "typ": "JWT"}
    Payload: {"sub": "user_id", "exp": 1234567890, ...}
    Signature: HMAC-SHA256(header + payload, secret)
    
    The signature ensures the token wasn't tampered with.
    Anyone can READ the payload (it's just base64), but
    only the server can CREATE valid signatures.
    
    Args:
        subject: Usually the user ID (stored in 'sub' claim)
        expires_delta: How long until token expires
        extra_claims: Additional data to include in token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),  # Issued at
        "type": "access",
    }
    
    if extra_claims:
        to_encode.update(extra_claims)
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(subject: str | int) -> str:
    """
    Create a longer-lived refresh token.
    
    🎓 INTERVIEW CONCEPT: Access + Refresh Token Pattern
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Why two tokens?
    - Access token: Short-lived (15-30 min), used for API calls
    - Refresh token: Long-lived (7-30 days), used only to get new access tokens
    
    Benefits:
    1. If access token is stolen, damage is limited (short expiry)
    2. User doesn't need to re-login frequently
    3. Refresh tokens can be stored more securely (httpOnly cookies)
    4. Can implement token rotation (new refresh token on each refresh)
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate a JWT token.
    
    Returns None if token is invalid or expired.
    
    🎓 INTERVIEW: This performs signature verification
    If someone tampers with the payload, the signature
    won't match and decoding will fail.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None
