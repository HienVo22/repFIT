"""
Application Configuration using Pydantic Settings.

🎓 INTERVIEW CONCEPT: Configuration Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Why use Pydantic Settings?
1. Type validation at startup (fail fast principle)
2. Environment variable loading with type coercion
3. Centralized configuration (Single Source of Truth)
4. Easy testing (override settings in tests)

This follows the "12-Factor App" methodology for config:
- Store config in environment variables
- Strict separation of config from code
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    🎓 INTERVIEW TIP: Pydantic validates types at runtime.
    If DATABASE_URL is missing or JWT_SECRET is too short,
    the app fails immediately on startup - not in production
    when a user hits that code path (fail fast principle).
    """
    
    # Application
    APP_NAME: str = "repFIT API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    # For PostgreSQL: postgresql+asyncpg://user:password@host:port/dbname
    # For SQLite (testing): sqlite+aiosqlite:///./repfit.db
    DATABASE_URL: str = "sqlite+aiosqlite:///./repfit.db"
    
    # JWT Authentication
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # External APIs
    USDA_API_KEY: str = ""
    USDA_API_BASE_URL: str = "https://api.nal.usda.gov/fdc/v1"
    
    # Redis (for caching)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS (for mobile app)
    CORS_ORIGINS: list[str] = ["*"]  # Restrict in production
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    
    🎓 INTERVIEW CONCEPT: Singleton Pattern via Caching
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Why @lru_cache?
    - Settings are read once and reused (O(1) lookup after first call)
    - Prevents re-parsing .env file on every request
    - Thread-safe in Python (GIL ensures atomic dict operations)
    
    This is a common pattern for expensive-to-create objects
    that should be shared across the application.
    """
    return Settings()
