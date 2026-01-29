"""
Routine & Exercise Models - Workout planning entities.

🎓 INTERVIEW CONCEPT: Entity Relationships
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User (1) ──────── (Many) Routine
Routine (1) ───── (Many) RoutineExercise

This is a classic hierarchical data model commonly asked
about in system design interviews for fitness/productivity apps.
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DayOfWeek(str, Enum):
    """
    Enum for days of the week.
    
    🎓 INTERVIEW: Using enums instead of strings prevents typos
    and makes the API self-documenting. The DB stores the string value.
    """
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class Routine(Base):
    """
    A workout routine template (e.g., "Push Day", "Leg Day").
    
    Users create routines and assign them to specific days.
    Each routine contains multiple exercises with target sets/reps.
    """
    
    __tablename__ = "routines"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Foreign Key to User
    # 🎓 INTERVIEW: Foreign keys enforce referential integrity at DB level
    # If you try to create a routine for non-existent user, DB rejects it
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,  # Index for faster user -> routines queries
    )
    
    # Routine metadata
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Schedule - which day this routine is assigned to
    day_of_week: Mapped[DayOfWeek | None] = mapped_column(
        SQLEnum(DayOfWeek),
        nullable=True,  # Routine might not be scheduled yet
    )
    
    # Timestamps
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
    user: Mapped["User"] = relationship("User", back_populates="routines")
    
    exercises: Mapped[list["RoutineExercise"]] = relationship(
        "RoutineExercise",
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineExercise.order",  # Maintain exercise order
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Routine(id={self.id}, name='{self.name}')>"


class RoutineExercise(Base):
    """
    An exercise within a routine, with target sets/reps/weight.
    
    🎓 INTERVIEW CONCEPT: Junction/Association Table Pattern
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    This table associates Routines with Exercises AND stores
    additional data specific to that association (target_sets, etc.)
    
    Without this table, you'd need:
    - A separate table for each routine's exercises, OR
    - Denormalized JSON blobs (harder to query)
    """
    
    __tablename__ = "routine_exercises"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Which routine this belongs to
    routine_id: Mapped[int] = mapped_column(
        ForeignKey("routines.id", ondelete="CASCADE"),
        index=True,
    )
    
    # Exercise details
    exercise_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Target metrics (what the user aims for)
    target_sets: Mapped[int] = mapped_column(Integer, default=3)
    target_reps: Mapped[int] = mapped_column(Integer, default=10)
    target_weight: Mapped[float | None] = mapped_column(nullable=True)  # in kg or lbs
    
    # Display order within routine
    # 🎓 INTERVIEW: Explicit ordering allows drag-and-drop reordering
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Optional notes (e.g., "Use slow negatives")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationship back to routine
    routine: Mapped["Routine"] = relationship(
        "Routine",
        back_populates="exercises",
    )
    
    def __repr__(self) -> str:
        return f"<RoutineExercise(id={self.id}, name='{self.exercise_name}')>"
