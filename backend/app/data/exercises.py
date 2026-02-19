"""
Static exercise catalog organized by muscle group.

Each exercise has: name, muscle_group, category (compound|isolation|cardio), equipment.
Used by the routine generator to build preset workout plans.
"""

from typing import TypedDict


class Exercise(TypedDict):
    name: str
    muscle_group: str
    category: str
    equipment: str


EXERCISES: list[Exercise] = [
    # ── Chest ──
    {"name": "Barbell Bench Press", "muscle_group": "chest", "category": "compound", "equipment": "barbell"},
    {"name": "Incline Dumbbell Press", "muscle_group": "chest", "category": "compound", "equipment": "dumbbell"},
    {"name": "Dumbbell Fly", "muscle_group": "chest", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Cable Fly", "muscle_group": "chest", "category": "isolation", "equipment": "cable"},
    {"name": "Incline Barbell Press", "muscle_group": "chest", "category": "compound", "equipment": "barbell"},
    {"name": "Chest Dip", "muscle_group": "chest", "category": "compound", "equipment": "bodyweight"},
    {"name": "Push-ups", "muscle_group": "chest", "category": "compound", "equipment": "bodyweight"},
    {"name": "Machine Chest Press", "muscle_group": "chest", "category": "compound", "equipment": "machine"},
    {"name": "Pec Deck", "muscle_group": "chest", "category": "isolation", "equipment": "machine"},

    # ── Shoulders ──
    {"name": "Overhead Press", "muscle_group": "shoulders", "category": "compound", "equipment": "barbell"},
    {"name": "Arnold Press", "muscle_group": "shoulders", "category": "compound", "equipment": "dumbbell"},
    {"name": "Lateral Raise", "muscle_group": "shoulders", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Front Raise", "muscle_group": "shoulders", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Face Pull", "muscle_group": "shoulders", "category": "isolation", "equipment": "cable"},
    {"name": "Reverse Pec Deck", "muscle_group": "shoulders", "category": "isolation", "equipment": "machine"},
    {"name": "Dumbbell Shoulder Press", "muscle_group": "shoulders", "category": "compound", "equipment": "dumbbell"},
    {"name": "Cable Lateral Raise", "muscle_group": "shoulders", "category": "isolation", "equipment": "cable"},
    {"name": "Upright Row", "muscle_group": "shoulders", "category": "compound", "equipment": "barbell"},

    # ── Triceps ──
    {"name": "Tricep Pushdown", "muscle_group": "triceps", "category": "isolation", "equipment": "cable"},
    {"name": "Skull Crushers", "muscle_group": "triceps", "category": "isolation", "equipment": "barbell"},
    {"name": "Overhead Tricep Extension", "muscle_group": "triceps", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Close-Grip Bench Press", "muscle_group": "triceps", "category": "compound", "equipment": "barbell"},
    {"name": "Dips", "muscle_group": "triceps", "category": "compound", "equipment": "bodyweight"},
    {"name": "Tricep Kickback", "muscle_group": "triceps", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Cable Overhead Extension", "muscle_group": "triceps", "category": "isolation", "equipment": "cable"},

    # ── Back ──
    {"name": "Barbell Row", "muscle_group": "back", "category": "compound", "equipment": "barbell"},
    {"name": "Pull-ups", "muscle_group": "back", "category": "compound", "equipment": "bodyweight"},
    {"name": "Lat Pulldown", "muscle_group": "back", "category": "compound", "equipment": "cable"},
    {"name": "Seated Cable Row", "muscle_group": "back", "category": "compound", "equipment": "cable"},
    {"name": "T-Bar Row", "muscle_group": "back", "category": "compound", "equipment": "barbell"},
    {"name": "Dumbbell Row", "muscle_group": "back", "category": "compound", "equipment": "dumbbell"},
    {"name": "Chin-ups", "muscle_group": "back", "category": "compound", "equipment": "bodyweight"},
    {"name": "Cable Pullover", "muscle_group": "back", "category": "isolation", "equipment": "cable"},
    {"name": "Machine Row", "muscle_group": "back", "category": "compound", "equipment": "machine"},

    # ── Biceps ──
    {"name": "Barbell Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "barbell"},
    {"name": "Dumbbell Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Hammer Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Preacher Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "barbell"},
    {"name": "Cable Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "cable"},
    {"name": "Incline Dumbbell Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "dumbbell"},
    {"name": "Concentration Curl", "muscle_group": "biceps", "category": "isolation", "equipment": "dumbbell"},

    # ── Quads ──
    {"name": "Barbell Squat", "muscle_group": "quads", "category": "compound", "equipment": "barbell"},
    {"name": "Leg Press", "muscle_group": "quads", "category": "compound", "equipment": "machine"},
    {"name": "Leg Extension", "muscle_group": "quads", "category": "isolation", "equipment": "machine"},
    {"name": "Bulgarian Split Squat", "muscle_group": "quads", "category": "compound", "equipment": "dumbbell"},
    {"name": "Hack Squat", "muscle_group": "quads", "category": "compound", "equipment": "machine"},
    {"name": "Front Squat", "muscle_group": "quads", "category": "compound", "equipment": "barbell"},
    {"name": "Goblet Squat", "muscle_group": "quads", "category": "compound", "equipment": "dumbbell"},
    {"name": "Walking Lunges", "muscle_group": "quads", "category": "compound", "equipment": "dumbbell"},

    # ── Hamstrings ──
    {"name": "Romanian Deadlift", "muscle_group": "hamstrings", "category": "compound", "equipment": "barbell"},
    {"name": "Lying Leg Curl", "muscle_group": "hamstrings", "category": "isolation", "equipment": "machine"},
    {"name": "Seated Leg Curl", "muscle_group": "hamstrings", "category": "isolation", "equipment": "machine"},
    {"name": "Good Mornings", "muscle_group": "hamstrings", "category": "compound", "equipment": "barbell"},
    {"name": "Dumbbell Romanian Deadlift", "muscle_group": "hamstrings", "category": "compound", "equipment": "dumbbell"},
    {"name": "Nordic Hamstring Curl", "muscle_group": "hamstrings", "category": "isolation", "equipment": "bodyweight"},

    # ── Glutes ──
    {"name": "Hip Thrust", "muscle_group": "glutes", "category": "compound", "equipment": "barbell"},
    {"name": "Glute Bridge", "muscle_group": "glutes", "category": "compound", "equipment": "barbell"},
    {"name": "Cable Kickback", "muscle_group": "glutes", "category": "isolation", "equipment": "cable"},
    {"name": "Step-ups", "muscle_group": "glutes", "category": "compound", "equipment": "dumbbell"},
    {"name": "Sumo Deadlift", "muscle_group": "glutes", "category": "compound", "equipment": "barbell"},

    # ── Calves ──
    {"name": "Standing Calf Raise", "muscle_group": "calves", "category": "isolation", "equipment": "machine"},
    {"name": "Seated Calf Raise", "muscle_group": "calves", "category": "isolation", "equipment": "machine"},
    {"name": "Donkey Calf Raise", "muscle_group": "calves", "category": "isolation", "equipment": "machine"},

    # ── Core ──
    {"name": "Plank", "muscle_group": "core", "category": "isolation", "equipment": "bodyweight"},
    {"name": "Cable Crunch", "muscle_group": "core", "category": "isolation", "equipment": "cable"},
    {"name": "Hanging Leg Raise", "muscle_group": "core", "category": "isolation", "equipment": "bodyweight"},
    {"name": "Russian Twist", "muscle_group": "core", "category": "isolation", "equipment": "bodyweight"},
    {"name": "Ab Wheel Rollout", "muscle_group": "core", "category": "isolation", "equipment": "bodyweight"},
    {"name": "Decline Crunch", "muscle_group": "core", "category": "isolation", "equipment": "bodyweight"},

    # ── Cardio ──
    {"name": "Treadmill Run", "muscle_group": "cardio", "category": "cardio", "equipment": "machine"},
    {"name": "Cycling", "muscle_group": "cardio", "category": "cardio", "equipment": "machine"},
    {"name": "Rowing Machine", "muscle_group": "cardio", "category": "cardio", "equipment": "machine"},
    {"name": "Stair Climber", "muscle_group": "cardio", "category": "cardio", "equipment": "machine"},
    {"name": "Jump Rope", "muscle_group": "cardio", "category": "cardio", "equipment": "bodyweight"},
    {"name": "Elliptical", "muscle_group": "cardio", "category": "cardio", "equipment": "machine"},
]


def get_exercises_by_muscle(muscle_group: str) -> list[Exercise]:
    return [e for e in EXERCISES if e["muscle_group"] == muscle_group]


def get_all_muscle_groups() -> list[str]:
    seen: set[str] = set()
    groups: list[str] = []
    for e in EXERCISES:
        if e["muscle_group"] not in seen:
            seen.add(e["muscle_group"])
            groups.append(e["muscle_group"])
    return groups


# ── Split templates ──
# Each split defines day names and per-day muscle group requirements.
# The tuple format is (muscle_group, exercise_count).

SPLIT_TEMPLATES: dict[str, dict] = {
    "push_pull_legs": {
        "label": "Push / Pull / Legs",
        "min_days": 3,
        "max_days": 6,
        "days": [
            {"name": "Push", "muscles": [("chest", 2), ("shoulders", 2), ("triceps", 2)]},
            {"name": "Pull", "muscles": [("back", 3), ("biceps", 2), ("shoulders", 1)]},
            {"name": "Legs", "muscles": [("quads", 2), ("hamstrings", 2), ("glutes", 1), ("calves", 1)]},
        ],
    },
    "arnold": {
        "label": "Arnold Split",
        "min_days": 6,
        "max_days": 6,
        "days": [
            {"name": "Chest & Back", "muscles": [("chest", 3), ("back", 3)]},
            {"name": "Shoulders & Arms", "muscles": [("shoulders", 3), ("biceps", 2), ("triceps", 2)]},
            {"name": "Legs", "muscles": [("quads", 3), ("hamstrings", 2), ("glutes", 1), ("calves", 2)]},
        ],
    },
    "upper_lower": {
        "label": "Upper / Lower",
        "min_days": 4,
        "max_days": 4,
        "days": [
            {"name": "Upper", "muscles": [("chest", 2), ("back", 2), ("shoulders", 2), ("biceps", 1), ("triceps", 1)]},
            {"name": "Lower", "muscles": [("quads", 2), ("hamstrings", 2), ("glutes", 1), ("calves", 1)]},
        ],
    },
    "full_body": {
        "label": "Full Body",
        "min_days": 3,
        "max_days": 3,
        "days": [
            {"name": "Full Body A", "muscles": [("chest", 1), ("back", 1), ("quads", 1), ("shoulders", 1), ("biceps", 1), ("triceps", 1)]},
            {"name": "Full Body B", "muscles": [("chest", 1), ("back", 1), ("hamstrings", 1), ("shoulders", 1), ("biceps", 1), ("calves", 1)]},
            {"name": "Full Body C", "muscles": [("chest", 1), ("back", 1), ("quads", 1), ("glutes", 1), ("triceps", 1), ("core", 1)]},
        ],
    },
    "bro_split": {
        "label": "Bro Split",
        "min_days": 5,
        "max_days": 5,
        "days": [
            {"name": "Chest", "muscles": [("chest", 4), ("core", 2)]},
            {"name": "Back", "muscles": [("back", 4), ("core", 2)]},
            {"name": "Shoulders", "muscles": [("shoulders", 4), ("core", 2)]},
            {"name": "Arms", "muscles": [("biceps", 3), ("triceps", 3)]},
            {"name": "Legs", "muscles": [("quads", 3), ("hamstrings", 2), ("glutes", 1), ("calves", 2)]},
        ],
    },
    "lift_cardio": {
        "label": "Lift + Cardio",
        "min_days": 4,
        "max_days": 6,
        "days": [
            {"name": "Upper Body", "muscles": [("chest", 2), ("back", 2), ("shoulders", 1), ("biceps", 1), ("triceps", 1)]},
            {"name": "Cardio", "muscles": [("cardio", 3), ("core", 2)]},
            {"name": "Lower Body", "muscles": [("quads", 2), ("hamstrings", 2), ("glutes", 1), ("calves", 1)]},
            {"name": "Cardio", "muscles": [("cardio", 3), ("core", 2)]},
        ],
    },
}


INTENSITY_PRESETS: dict[str, dict[str, int]] = {
    "hypertrophy": {"sets": 3, "reps_min": 10, "reps_max": 15},
    "strength": {"sets": 5, "reps_min": 3, "reps_max": 6},
    "balanced": {"sets": 4, "reps_min": 8, "reps_max": 12},
}


DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
