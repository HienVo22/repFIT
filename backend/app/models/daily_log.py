"""DailyLog, WorkoutSession, CompletedSet, and NutritionLog models."""

from datetime import datetime, date
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DailyLog(Base):
    """Aggregate root for a single date -- contains workout sessions and nutrition logs."""

    __tablename__ = "daily_logs"

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_user_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    log_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

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
    """A completed workout session. Stores routine_name as a snapshot so history
    survives routine renames/deletes."""

    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    daily_log_id: Mapped[int] = mapped_column(
        ForeignKey("daily_logs.id", ondelete="CASCADE"),
        index=True,
    )

    routine_id: Mapped[int | None] = mapped_column(
        ForeignKey("routines.id", ondelete="SET NULL"),
        nullable=True,
    )
    routine_name: Mapped[str] = mapped_column(String(100), nullable=False)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    __tablename__ = "completed_sets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    workout_session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        index=True,
    )

    exercise_name: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reps_completed: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_used: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_completed: Mapped[bool] = mapped_column(default=True)

    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    workout_session: Mapped["WorkoutSession"] = relationship(
        "WorkoutSession",
        back_populates="completed_sets",
    )

    def __repr__(self) -> str:
        return f"<CompletedSet(exercise='{self.exercise_name}', reps={self.reps_completed})>"


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    daily_log_id: Mapped[int] = mapped_column(
        ForeignKey("daily_logs.id", ondelete="CASCADE"),
        index=True,
    )

    raw_input: Mapped[str] = mapped_column(Text, nullable=False)

    calories: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    fiber_g: Mapped[float] = mapped_column(Float, default=0)

    meal_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    daily_log: Mapped["DailyLog"] = relationship(
        "DailyLog",
        back_populates="nutrition_logs",
    )

    def __repr__(self) -> str:
        return f"<NutritionLog(id={self.id}, calories={self.calories})>"
