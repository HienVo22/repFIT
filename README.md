# repFIT


This is a AI fitness mobile app that let you log your customizable workouts/nutritions routine.

## Demo



https://github.com/user-attachments/assets/45a62f3f-61c3-49d0-92f5-57902e020cc9



## Tech Stack

| Mobile | React Native, Expo SDK 50+, TypeScript |
| State | Zustand, TanStack Query |
| Backend | FastAPI, Python |
| Database | PostgreSQL, SQLAlchemy |
| Migrations | Alembic |
| Auth | JWT (OAuth2) |

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:
```bash
createdb repfit
```

### 2. Backend Setup

```bash

# Create virtual environment
python -m venv venv
source venv/bin/activate  

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Mobile Setup

```bash

# Install dependencies
npm install

# Start Expo development server
npx expo start
```


## License

MIT License
