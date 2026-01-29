"""
FastAPI Application Entry Point.

🎓 INTERVIEW CONCEPT: Application Factory Pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This module creates and configures the FastAPI application.
Key concepts:
1. Lifespan events (startup/shutdown)
2. Middleware configuration (CORS, logging)
3. Router inclusion (API versioning)
4. Exception handlers

Run with: uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine
from app.api.v1.router import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    🎓 INTERVIEW CONCEPT: Resource Management
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    The lifespan context manager handles:
    - Startup: Initialize resources (DB pool, cache connections)
    - Shutdown: Clean up resources (close connections)
    
    This is crucial for:
    1. Preventing resource leaks
    2. Graceful shutdown (finish pending requests)
    3. Connection pool management
    
    The `yield` separates startup from shutdown code.
    """
    # Startup
    print(f"🚀 Starting {settings.APP_NAME}")
    # Database pool is created lazily by SQLAlchemy
    # Add any other startup logic here (Redis connection, etc.)
    
    yield  # Application runs here
    
    # Shutdown
    print(f"👋 Shutting down {settings.APP_NAME}")
    await engine.dispose()  # Close all DB connections


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Workout tracking and nutrition logging API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc",    # ReDoc alternative
    openapi_url="/openapi.json",
)


# CORS Middleware
# 🎓 INTERVIEW CONCEPT: Cross-Origin Resource Sharing
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CORS is a browser security feature that restricts
# web pages from making requests to different domains.
# 
# For mobile apps (React Native), CORS is less relevant
# since they don't run in a browser sandbox. However,
# we enable it for:
# 1. Web-based testing/debugging
# 2. Future web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
# 🎓 INTERVIEW CONCEPT: API Versioning
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Versioning your API (v1, v2) allows:
# 1. Breaking changes without breaking existing clients
# 2. Gradual migration path
# 3. Supporting multiple API versions simultaneously
#
# Common versioning strategies:
# - URL path: /api/v1/users (we use this)
# - Header: Accept: application/vnd.api+json;version=1
# - Query param: /users?version=1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    🎓 INTERVIEW: Health checks are essential for:
    1. Load balancer health probing
    2. Kubernetes liveness/readiness probes
    3. Monitoring and alerting
    
    A more sophisticated check would verify DB connectivity.
    """
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "health": "/health",
        "api": settings.API_V1_PREFIX,
    }
