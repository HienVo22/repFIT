"""Routine and exercise models."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    day_of_week: Mapped[DayOfWeek | None] = mapped_column(
        SQLEnum(DayOfWeek),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship("User", back_populates="routines")

    exercises: Mapped[list["RoutineExercise"]] = relationship(
        "RoutineExercise",
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineExercise.order",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Routine(id={self.id}, name='{self.name}')>"


class RoutineExercise(Base):
    __tablename__ = "routine_exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    routine_id: Mapped[int] = mapped_column(
        ForeignKey("routines.id", ondelete="CASCADE"),
        index=True,
    )

    exercise_name: Mapped[str] = mapped_column(String(100), nullable=False)
    target_sets: Mapped[int] = mapped_column(Integer, default=3)
    target_reps: Mapped[int] = mapped_column(Integer, default=10)
    target_weight: Mapped[float | None] = mapped_column(nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    routine: Mapped["Routine"] = relationship(
        "Routine",
        back_populates="exercises",
    )

    def __repr__(self) -> str:
        return f"<RoutineExercise(id={self.id}, name='{self.exercise_name}')>"
