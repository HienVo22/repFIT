# repFIT

A mobile application combining automated strength progression protocols with nutrition tracking. Built with a decoupled client-server architecture where a Python backend serves data to a React Native mobile client.

## Features

### Implemented
- User authentication (register, login, JWT tokens)
- Workout routine management (create, read, update, delete)
- Exercise management within routines
- Dashboard with calendar view
- Active workout session with timer and set tracking
- Nutrition logging interface with macro display
- User profile management

### Planned
- Workout session API (save completed workouts to database)
- Natural language nutrition parsing via USDA API
- Historical workout data lookup for progressive overload
- Calendar data aggregation (workout and nutrition indicators)
- Redis caching for external API calls

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo SDK 50+, TypeScript |
| State | Zustand (global), TanStack Query (server) |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL, SQLAlchemy (async) |
| Migrations | Alembic |
| Auth | JWT (OAuth2 Password Flow) |

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Expo Go app on your mobile device (for testing)

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:
```bash
createdb repfit
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000
API documentation at http://localhost:8000/docs

### 3. Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go app on your phone, or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

### 4. Environment Variables

Backend `.env` file:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/repfit
JWT_SECRET=your-secret-key-here
USDA_API_KEY=your-usda-api-key
```

Mobile: Create `.env` in mobile folder:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api/v1
```

Note: Replace YOUR_LOCAL_IP with your computer's local IP address (not localhost) for the mobile app to connect to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login and get tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| GET | /api/v1/users/me | Get current user profile |
| PATCH | /api/v1/users/me | Update user profile |
| GET | /api/v1/routines | List all routines |
| POST | /api/v1/routines | Create routine |
| GET | /api/v1/routines/{id} | Get routine details |
| PATCH | /api/v1/routines/{id} | Update routine |
| DELETE | /api/v1/routines/{id} | Delete routine |
| POST | /api/v1/routines/{id}/exercises | Add exercise to routine |
| PATCH | /api/v1/routines/{id}/exercises/{eid} | Update exercise |
| DELETE | /api/v1/routines/{id}/exercises/{eid} | Delete exercise |

## License

MIT License
