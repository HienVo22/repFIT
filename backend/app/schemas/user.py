"""Pydantic schemas for user operations."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=100,
        description="Password must be at least 8 characters",
    )


class UserUpdate(BaseModel):
    """All fields optional -- only provided fields are updated."""
    email: EmailStr | None = None
    username: str | None = Field(default=None, min_length=3, max_length=50)
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=100)


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    type: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
