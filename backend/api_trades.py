from fastapi import APIRouter, Request, Query, Depends
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func
from db import AsyncSessionLocal
from models import Trade
from auth import get_current_user
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/trades")
async def get_trades(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    side: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    user=Depends(get_current_user),
):
    user_id = int(user["sub"])
    filters = [Trade.user_id == user_id]
    if symbol:
        filters.append(Trade.symbol.ilike(f"%{symbol.upper()}%"))
    if side and side.lower() in ["buy", "sell"]:
        filters.append(Trade.side == side.lower())
    if dateFrom:
        try:
            dt_from = datetime.fromisoformat(dateFrom)
            filters.append(Trade.filled_time >= dt_from.isoformat())
        except Exception:
            pass
    if dateTo:
        try:
            dt_to = datetime.fromisoformat(dateTo)
            filters.append(Trade.filled_time <= dt_to.isoformat())
        except Exception:
            pass
    async with AsyncSessionLocal() as session:
        q = select(Trade).where(and_(*filters)).order_by(Trade.filled_time.desc())
        total = (await session.execute(q)).scalars().all()
        total_count = len(total)
        q = q.offset((page - 1) * limit).limit(limit)
        result = await session.execute(q)
        trades = result.scalars().all()
        trade_dicts = [
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "qty": t.qty,
                "price": t.price,
                "filled_time": t.filled_time,
                "status": t.status,
                "broker": t.broker,
                "realized_pnl": (t.exit - t.price) * t.qty if hasattr(t, "exit") and t.exit and t.price and t.qty else None,
            }
            for t in trades
        ]
        return {
            "trades": trade_dicts,
            "total": total_count,
            "page": page,
            "limit": limit,
        }
