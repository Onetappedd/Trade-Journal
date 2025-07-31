from fastapi import APIRouter, Query, Depends, HTTPException, Request
from datetime import datetime, timedelta
import requests
import os
from auth import get_current_user
from db import AsyncSessionLocal
from models import Trade
from sqlalchemy.future import select

router = APIRouter()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"

@router.get("/api/chart-data")
async def chart_data(
    symbol: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    request: Request = None,
    trade_ids: str = Query(None),
    user=Depends(get_current_user),
):
    # Fetch OHLCV data from Alpha Vantage (1h resolution)
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol.upper(),
        "interval": "60min",
        "outputsize": "full",
        "apikey": ALPHA_VANTAGE_API_KEY,
    }
    resp = requests.get(ALPHA_VANTAGE_URL, params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Alpha Vantage API error.")
    data = resp.json()
    if "Time Series (60min)" not in data:
        raise HTTPException(status_code=404, detail="No chart data found.")
    ohlc = []
    for ts, v in data["Time Series (60min)"].items():
        if start_date <= ts <= end_date:
            ohlc.append({
                "timestamp": ts,
                "open": float(v["1. open"]),
                "high": float(v["2. high"]),
                "low": float(v["3. low"]),
                "close": float(v["4. close"]),
                "volume": float(v["5. volume"]),
            })
    ohlc.sort(key=lambda x: x["timestamp"])

    # Overlay trade data for this user and symbol
    trades = []
    async with AsyncSessionLocal() as session:
        filters = [Trade.user_id == int(user["sub"]), Trade.symbol == symbol.upper()]
        if trade_ids:
            ids = [int(tid) for tid in trade_ids.split(",") if tid.isdigit()]
            if ids:
                filters.append(Trade.id.in_(ids))
        q = select(Trade).where(*filters)
        result = await session.execute(q)
        for t in result.scalars().all():
            trades.append({
                "id": t.id,
                "type": t.type,
                "side": t.side,
                "qty": t.qty,
                "price": t.price,
                "timestamp": t.filled_time or t.placed_time,
                "pnl": None,  # Can be filled in by frontend/grouping logic
            })
    return {"ohlc": ohlc, "trades": trades}
