"""
User Model - Core authentication entity.

🎓 INTERVIEW CONCEPT: Database Normalization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This schema follows 3NF (Third Normal Form):
1. 1NF: All columns contain atomic values (no arrays in a single column)
2. 2NF: All non-key columns depend on the entire primary key
3. 3NF: No transitive dependencies (non-key columns don't depend on each other)

The User table is the "root" entity - other tables reference it via foreign keys.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# TYPE_CHECKING prevents circular imports at runtime
# These imports only happen during static type analysis
if TYPE_CHECKING:
    from app.models.routine import Routine
    from app.models.daily_log import DailyLog


class User(Base):
    """
    User account model.
    
    🎓 INTERVIEW TIP: SQLAlchemy 2.0 uses Mapped[] for type hints
    This enables better IDE support and static type checking.
    """
    
    __tablename__ = "users"
    
    # Primary Key
    # 🎓 INTERVIEW: Integer PKs are faster for joins than UUIDs
    # but UUIDs are better for distributed systems (no coordination needed)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,  # 🎓 INDEX: O(log n) lookups vs O(n) table scan
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile fields
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    # 🎓 INTERVIEW: server_default uses DB-level defaults (more reliable)
    # vs default= which is Python-level (depends on app server time)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    # Relationships
    # 🎓 INTERVIEW CONCEPT: One-to-Many Relationship
    # One User has Many Routines, One User has Many DailyLogs
    # back_populates creates bidirectional navigation
    routines: Mapped[list["Routine"]] = relationship(
        "Routine",
        back_populates="user",
        cascade="all, delete-orphan",  # Delete routines when user is deleted
        lazy="selectin",  # Efficient async loading strategy
    )
    
    daily_logs: Mapped[list["DailyLog"]] = relationship(
        "DailyLog",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
