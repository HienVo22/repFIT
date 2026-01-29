# repFIT 💪

A high-performance mobile application combining automated strength progression protocols with frictionless nutrition tracking. Built as a professional-grade portfolio project demonstrating full-stack engineering skills.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE CLIENT                            │
│              React Native (Expo) + TypeScript                   │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│    │   Zustand   │  │  TanStack   │  │   Tamagui   │          │
│    │   (Global)  │  │   Query     │  │    (UI)     │          │
│    └─────────────┘  └─────────────┘  └─────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API SERVER                               │
│                   Python (FastAPI) + Async                      │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│    │   Pydantic  │  │    JWT      │  │   Caching   │          │
│    │  Validation │  │    Auth     │  │   (Redis)   │          │
│    └─────────────┘  └─────────────┘  └─────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQLAlchemy (Async)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                │
│    Users ──┬── Routines ──── Exercises                         │
│            ├── DailyLogs ─── WorkoutSessions                   │
│            └── NutritionLogs                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Core Features

| Feature | Description |
|---------|-------------|
| **Active Session** | Strava-style workout tracking with background timer |
| **Progressive Overload** | Historical lookup for lift progression |
| **Natural Language Nutrition** | "1 banana and greek yogurt" → parsed macros |
| **Unified Calendar** | Monthly view with workout/nutrition indicators |

## 📁 Project Structure

```
repFIT/
├── backend/                 # FastAPI Server
│   ├── app/
│   │   ├── api/v1/         # API routes (versioned)
│   │   ├── core/           # Config, security, dependencies
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Helpers (USDA client, etc.)
│   ├── alembic/            # Database migrations
│   ├── tests/              # Pytest test suite
│   └── requirements.txt
│
├── mobile/                  # React Native (Expo)
│   ├── src/
│   │   ├── api/            # API client (axios/fetch)
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   ├── store/          # Zustand global state
│   │   ├── hooks/          # Custom hooks + TanStack Query
│   │   └── types/          # TypeScript interfaces
│   └── app.json
│
└── README.md
```

## 🧠 Interview-Relevant Concepts

This project demonstrates:

- **System Design**: Decoupled client-server architecture, API versioning
- **Database Design**: Normalized schema, One-to-Many relationships, indexing strategies
- **Concurrency**: Python async/await, connection pooling
- **Caching Strategies**: Server-side caching for external API calls (USDA)
- **Authentication**: Stateless JWT, OAuth2 password flow
- **State Management**: Optimistic updates, server state vs. client state separation
- **Type Safety**: End-to-end type safety (Pydantic ↔ TypeScript)

## 🚀 Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## 📚 Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo SDK 50+, TypeScript |
| State | Zustand (global), TanStack Query (server) |
| UI | Tamagui |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL, SQLAlchemy (async) |
| Migrations | Alembic |
| Auth | JWT (OAuth2 Password Flow) |

## 📄 License

MIT License - Free and open source.
