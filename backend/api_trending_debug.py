from fastapi import APIRouter
from db import AsyncSessionLocal
from models import TrendingTweet
from sqlalchemy.future import select
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/api/trending-debug")
async def trending_debug():
    async with AsyncSessionLocal() as session:
        q = select(TrendingTweet).order_by(TrendingTweet.timestamp.desc()).limit(10)
        result = await session.execute(q)
        tweets = result.scalars().all()
        return [{
            "symbol": t.symbol,
            "text": t.text,
            "sentiment_label": t.sentiment_label,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None
        } for t in tweets]
