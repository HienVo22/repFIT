"""Food search endpoint -- proxies USDA FoodData Central API."""

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import get_settings

router = APIRouter()

NUTRIENT_IDS = {
    1008: "calories",
    1003: "protein_g",
    1005: "carbs_g",
    1004: "fat_g",
    1079: "fiber_g",
}


def _extract_nutrients(food: dict) -> dict:
    nutrients = {v: 0.0 for v in NUTRIENT_IDS.values()}
    for n in food.get("foodNutrients", []):
        nid = n.get("nutrientId") or n.get("nutrientNumber")
        if isinstance(nid, str) and nid.isdigit():
            nid = int(nid)
        if nid in NUTRIENT_IDS:
            nutrients[NUTRIENT_IDS[nid]] = round(n.get("value", 0), 1)
    return nutrients


def _extract_serving(food: dict) -> str:
    measure = food.get("servingSize")
    unit = food.get("servingSizeUnit", "g")
    if measure:
        return f"{measure}{unit}"
    portions = food.get("foodMeasures", [])
    if portions:
        p = portions[0]
        return p.get("disseminationText", "100g")
    return "100g"


@router.get("/search")
async def search_foods(
    query: str = Query(min_length=2, max_length=200),
    page_size: int = Query(default=10, ge=1, le=25),
):
    """Search USDA FoodData Central for foods matching a query."""
    settings = get_settings()

    if not settings.USDA_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="USDA API key not configured. Set USDA_API_KEY in your .env file.",
        )

    url = f"{settings.USDA_API_BASE_URL}/foods/search"
    params = {"api_key": settings.USDA_API_KEY}
    body = {
        "query": query,
        "pageSize": page_size,
        "dataType": ["Foundation", "SR Legacy", "Branded"],
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(url, params=params, json=body)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"USDA API error: {e.response.text[:200]}",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to reach USDA API: {str(e)[:200]}",
            )

    data = resp.json()
    foods = []
    for item in data.get("foods", []):
        nutrients = _extract_nutrients(item)
        foods.append({
            "fdc_id": item.get("fdcId", 0),
            "name": item.get("description", "Unknown"),
            "calories": nutrients["calories"],
            "protein_g": nutrients["protein_g"],
            "carbs_g": nutrients["carbs_g"],
            "fat_g": nutrients["fat_g"],
            "fiber_g": nutrients["fiber_g"],
            "serving_size": _extract_serving(item),
        })

    return {"foods": foods, "query": query}
