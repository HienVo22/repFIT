"""
Async Database Configuration with SQLAlchemy 2.0.

🎓 INTERVIEW CONCEPT: Connection Pooling & Async I/O
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Why async database connections?
1. Non-blocking I/O: While waiting for DB response, the event loop
   can handle other requests (crucial for high concurrency)
2. Connection pooling: Reuse connections instead of creating new ones
   (creating a TCP connection + auth is expensive ~10-50ms)

Time Complexity Comparison:
- Without pooling: O(n) connections for n concurrent requests
- With pooling: O(1) amortized - connections are reused

This is a CRITICAL concept for system design interviews!
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# Create async engine with connection pooling
# SQLite doesn't support pool_size/max_overflow, so we configure conditionally
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},  # Required for SQLite
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )

# Session factory - creates new sessions for each request
# 🎓 INTERVIEW: This is the Factory Pattern - creates objects without
# exposing instantiation logic to the client
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit (needed for async)
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    
    🎓 INTERVIEW CONCEPT: Declarative Base Pattern
    All models inherit from this class, which provides:
    - Automatic table name generation
    - Metadata collection for migrations
    - Common functionality across all models
    """
    pass


async def get_db() -> AsyncSession:
    """
    Dependency injection for database sessions.
    
    🎓 INTERVIEW CONCEPT: Dependency Injection (DI)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Why DI?
    1. Decoupling: Routes don't create their own DB connections
    2. Testability: Easy to mock/replace in tests
    3. Lifecycle management: FastAPI handles session cleanup
    
    The `yield` makes this a generator - code after yield runs
    on request completion (cleanup phase).
    
    Usage in routes:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
