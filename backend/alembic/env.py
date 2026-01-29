"""
Alembic Migration Environment.

🎓 INTERVIEW CONCEPT: Database Migrations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migrations are version-controlled database schema changes.
Instead of manually running ALTER TABLE commands, you:

1. Make changes to SQLAlchemy models
2. Run: alembic revision --autogenerate -m "Add users table"
3. Review the generated migration file
4. Run: alembic upgrade head

This provides:
- Reproducible deployments
- Rollback capability
- Team collaboration (migrations in git)

Common interview questions:
- "How do you handle database changes in production?"
- "What happens if a migration fails halfway?"
- "How do you handle data migrations vs schema migrations?"
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import your models' Base
from app.core.database import Base
from app.core.config import get_settings

# Import all models so Alembic can detect them
from app.models import (
    User,
    Routine,
    RoutineExercise,
    DailyLog,
    WorkoutSession,
    CompletedSet,
    NutritionLog,
)

# Alembic Config object
config = context.config

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata

# Get database URL from settings
settings = get_settings()


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This generates SQL without connecting to the database.
    Useful for reviewing migrations before applying.
    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with a database connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations in 'online' mode with async engine.
    
    🎓 INTERVIEW: Note we use async_engine_from_config
    because our app uses async SQLAlchemy.
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
