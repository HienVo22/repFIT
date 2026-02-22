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

## Features


* User Authentication: Includes a secure login and logout system, with a dedicated sign up option for new users.

* Personalized Profile Management: Allows users to edit their profile details, including username and email.

* Customizable Workout Preferences: Features settings to select a preferred training split like PPL and a specific training frequency (how many days a week).

* AI Routine Builder: Offers an "Assistant" mode that generates a full workout program based on user-selected intensity and goals.

* Manual Routine Creation: Provides an interface to build custom workout routines from scratch for total control over exercises and structure.

* Interactive Workout Tracking: Enables real-time logging of sets, reps, and weights, including a built-in rest timer for each set.

* Intelligent Coach's Analysis: Delivers an AI generated summary after each workout to provide feedback on performance and suggestions for improvement.

* Nutritional Goal Setting: Includes a calculator to determine personalized daily targets for calories and macros based on body stats (age, weight, height) and activity level.

* Integrated Food Logging: Features a searchable database to log daily meals and track intake against nutritional targets.

* Comprehensive Activity Dashboard: Displays a calendar view of workouts and nutrition history to visualize progress over time.

## Starting the App

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
