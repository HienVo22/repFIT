"""Google Gemini AI service wrapper."""

import json
import google.generativeai as genai
from app.core.config import get_settings


def _get_model():
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured. Set it in your .env file.")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-2.5-flash")


async def parse_food_description(text: str) -> list[dict]:
    """Parse a natural language food description into structured nutrition items."""
    model = _get_model()

    prompt = f"""You are a nutrition expert. Parse the following food description into individual food items with estimated macronutrient values per serving.

Food description: "{text}"

Return a JSON array of objects. Each object must have exactly these fields:
- "name": string (food item name with quantity if mentioned)
- "calories": number (estimated calories)
- "protein_g": number (grams of protein)
- "carbs_g": number (grams of carbs)
- "fat_g": number (grams of fat)

Use standard American serving sizes. Be reasonably accurate with calorie estimates.
Return ONLY the JSON array, no other text or markdown formatting."""

    response = await model.generate_content_async(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    return json.loads(raw)


async def get_coach_notes(routine_data: dict) -> list[str]:
    """Generate AI coaching tips for a generated routine."""
    model = _get_model()

    prompt = f"""You are an experienced fitness coach. Review this workout routine and provide 3-5 concise, actionable tips.

Routine:
{json.dumps(routine_data, indent=2)}

Consider: exercise order, warm-up needs, muscle balance, rest periods, and progressive overload.
Return a JSON array of strings (each string is one tip).
Return ONLY the JSON array, no other text or markdown formatting."""

    response = await model.generate_content_async(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    return json.loads(raw)


async def get_workout_summary(workout_data: dict) -> dict:
    """Generate a post-workout AI summary with tips."""
    model = _get_model()

    prompt = f"""You are a supportive fitness coach. Analyze this completed workout and provide a brief motivational summary with 2-3 actionable tips for next time.

Workout data:
{json.dumps(workout_data, indent=2)}

Return a JSON object with exactly these fields:
- "summary": string (2-3 sentences summarizing the workout performance)
- "tips": array of strings (2-3 short actionable tips)

Be encouraging but specific. Reference actual exercises and numbers from the data.
Return ONLY the JSON object, no other text or markdown formatting."""

    response = await model.generate_content_async(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    return json.loads(raw)
