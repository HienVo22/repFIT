"""
DailyLog, WorkoutSession, and NutritionLog Models.

🎓 INTERVIEW CONCEPT: Data Modeling for Time-Series Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This models daily activities that need to be:
1. Queried by date (calendar view)
2. Aggregated over time (weekly/monthly summaries)
3. Compared historically (progressive overload tracking)

Key design decisions:
- DailyLog is the "anchor" for a given date
- WorkoutSession/NutritionLog are children of DailyLog
- This allows easy "what happened on this date?" queries
"""

from datetime import datetime, date
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DailyLog(Base):
    """
    A daily log entry - the "container" for a specific date.
    
    🎓 INTERVIEW TIP: This is the "aggregate root" pattern from DDD.
    Instead of querying workouts and nutrition separately,
    we query the DailyLog and get everything for that date.
    """
    
    __tablename__ = "daily_logs"
    
    # Composite unique constraint: one log per user per date
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_user_date"),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    
    # The date this log represents
    # 🎓 INTERVIEW: Using Date (not DateTime) for day-level queries
    # This enables efficient "get all logs for January" queries
    log_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    
    # Optional daily notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
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
    user: Mapped["User"] = relationship("User", back_populates="daily_logs")
    
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        "WorkoutSession",
        back_populates="daily_log",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    nutrition_logs: Mapped[list["NutritionLog"]] = relationship(
        "NutritionLog",
        back_populates="daily_log",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<DailyLog(id={self.id}, date={self.log_date})>"


class WorkoutSession(Base):
    """
    A completed workout session with duration and exercises performed.
    
    🎓 INTERVIEW CONCEPT: Capturing Historical Data
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Notice that WorkoutSession stores the routine_name as a string,
    not just a foreign key. Why?
    
    If the user later deletes/renames the routine, we still want
    historical records to show what routine was performed.
    This is called "snapshot" or "event sourcing" pattern.
    """
    
    __tablename__ = "workout_sessions"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    daily_log_id: Mapped[int] = mapped_column(
        ForeignKey("daily_logs.id", ondelete="CASCADE"),
        index=True,
    )
    
    # Snapshot of routine info (preserved even if routine is deleted)
    routine_id: Mapped[int | None] = mapped_column(
        ForeignKey("routines.id", ondelete="SET NULL"),
        nullable=True,
    )
    routine_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Session timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Session notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    daily_log: Mapped["DailyLog"] = relationship(
        "DailyLog",
        back_populates="workout_sessions",
    )
    
    completed_sets: Mapped[list["CompletedSet"]] = relationship(
        "CompletedSet",
        back_populates="workout_session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<WorkoutSession(id={self.id}, routine='{self.routine_name}')>"


class CompletedSet(Base):
    """
    A single set completed during a workout session.
    
    🎓 INTERVIEW: Granular Data for Progressive Overload
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Storing individual sets allows:
    1. "What was my best set for bench press?" queries
    2. Volume calculations (sets × reps × weight)
    3. Detailed progress tracking over time
    
    Query for last performance of an exercise:
    SELECT * FROM completed_sets
    WHERE exercise_name = 'Bench Press'
    ORDER BY completed_at DESC LIMIT 1
    """
    
    __tablename__ = "completed_sets"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    workout_session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        index=True,
    )
    
    # Exercise identification
    exercise_name: Mapped[str] = mapped_column(
        String(100),
        index=True,  # 🎓 INDEX: Fast lookups for "history of bench press"
        nullable=False,
    )
    
    # Actual performance
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reps_completed: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_used: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Was this set completed as planned?
    is_completed: Mapped[bool] = mapped_column(default=True)
    
    # When this set was completed
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    # Optional notes (e.g., "felt easy", "form breakdown")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationship
    workout_session: Mapped["WorkoutSession"] = relationship(
        "WorkoutSession",
        back_populates="completed_sets",
    )
    
    def __repr__(self) -> str:
        return f"<CompletedSet(exercise='{self.exercise_name}', reps={self.reps_completed})>"


class NutritionLog(Base):
    """
    A nutrition entry parsed from natural language input.
    
    🎓 INTERVIEW CONCEPT: Caching External API Results
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    The raw_input field stores the original text.
    The parsed macros are stored separately.
    
    Why store both?
    1. User can see what they typed
    2. Can re-parse if parsing algorithm improves
    3. Debugging/auditing
    """
    
    __tablename__ = "nutrition_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    daily_log_id: Mapped[int] = mapped_column(
        ForeignKey("daily_logs.id", ondelete="CASCADE"),
        index=True,
    )
    
    # Original user input
    raw_input: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Parsed macros (aggregated from USDA API)
    calories: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    fiber_g: Mapped[float] = mapped_column(Float, default=0)
    
    # Meal categorization (optional)
    meal_type: Mapped[str | None] = mapped_column(
        String(50),  # breakfast, lunch, dinner, snack
        nullable=True,
    )
    
    # When this was logged
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    # Relationship
    daily_log: Mapped["DailyLog"] = relationship(
        "DailyLog",
        back_populates="nutrition_logs",
    )
    
    def __repr__(self) -> str:
        return f"<NutritionLog(id={self.id}, calories={self.calories})>"
