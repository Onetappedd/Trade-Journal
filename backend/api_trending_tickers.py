from fastapi import APIRouter, Query
from trending_tweets import get_trending_tickers

router = APIRouter()

@router.get("/api/trending-tickers")
async def trending_tickers(window_minutes: int = Query(1440, ge=10, le=10080)):
    trending = await get_trending_tickers(window_minutes=window_minutes)
    return {"trending": trending}
