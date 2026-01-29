"""
Pydantic Schemas for User operations.

🎓 INTERVIEW CONCEPT: DTOs (Data Transfer Objects)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Why separate Pydantic schemas from SQLAlchemy models?

1. Security: Control what fields are exposed to the API
   - UserCreate includes password
   - UserResponse does NOT include password
   
2. Validation: Different rules for different operations
   - Create: password required, at least 8 chars
   - Update: password optional
   
3. Decoupling: API contract is independent of DB schema
   - Can change DB without breaking API
   - Can version API without changing DB
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base schema with common fields."""
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    full_name: str | None = None


class UserCreate(UserBase):
    """
    Schema for user registration.
    
    🎓 INTERVIEW: Password validation happens here, not in the model.
    This keeps the model focused on data storage, not business rules.
    """
    password: str = Field(
        min_length=8,
        max_length=100,
        description="Password must be at least 8 characters",
    )


class UserUpdate(BaseModel):
    """
    Schema for updating user profile.
    
    All fields are optional - only provided fields are updated.
    This is called a "partial update" or "PATCH" pattern.
    """
    email: EmailStr | None = None
    username: str | None = Field(default=None, min_length=3, max_length=50)
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=100)


class UserResponse(UserBase):
    """
    Schema for API responses.
    
    🎓 INTERVIEW: Note that password is NOT included here.
    This prevents accidentally leaking sensitive data.
    
    model_config with from_attributes=True allows creating
    this schema directly from SQLAlchemy model instances.
    """
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """
    Schema representing user as stored in DB.
    Used internally, never returned to API clients.
    """
    hashed_password: str


# Authentication schemas
class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload."""
    sub: str  # Subject (user ID)
    exp: datetime  # Expiration
    type: str  # "access" or "refresh"


class LoginRequest(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str
