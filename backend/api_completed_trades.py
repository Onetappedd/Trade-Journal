from fastapi import APIRouter, Request, Query, Depends
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func
from db import AsyncSessionLocal
from models import Trade
from auth import get_current_user
from typing import Optional, List
from datetime import datetime

router = APIRouter()

def group_trades(trades: List[Trade]):
    # Sort by symbol, then by time
    trades = sorted(trades, key=lambda t: (t.symbol, t.filled_time or t.placed_time or "", t.side))
    grouped = []
    used = set()
    for i, t in enumerate(trades):
        if i in used or t.side not in ["buy", "sell"]:
            continue
        # Find matching exit
        for j in range(i+1, len(trades)):
            t2 = trades[j]
            if j in used:
                continue
            if (
                t2.symbol == t.symbol and
                t2.side != t.side and
                t2.qty == t.qty and
                (t2.filled_time or t2.placed_time) > (t.filled_time or t.placed_time)
            ):
                entry, exit = (t, t2) if t.side == "buy" else (t2, t)
                entry_time = entry.filled_time or entry.placed_time
                exit_time = exit.filled_time or exit.placed_time
                duration = None
                if entry_time and exit_time:
                    try:
                        dt1 = datetime.fromisoformat(entry_time)
                        dt2 = datetime.fromisoformat(exit_time)
                        duration = str(dt2 - dt1)
                    except Exception:
                        duration = None
                grouped.append({
                    "symbol": t.symbol,
                    "type": t.type,
                    "side": entry.side,
                    "quantity": entry.qty,
                    "entry_price": entry.price,
                    "exit_price": exit.price,
                    "entry_time": entry_time,
                    "exit_time": exit_time,
                    "realized_pnl": (exit.price - entry.price) * entry.qty if entry.price and exit.price and entry.qty else None,
                    "duration": duration,
                    "broker": t.broker,
                    "status": "closed",
                    "trade_ids": [entry.id, exit.id],
                })
                used.add(i)
                used.add(j)
                break
        else:
            # No exit found, treat as open
            grouped.append({
                "symbol": t.symbol,
                "type": t.type,
                "side": t.side,
                "quantity": t.qty,
                "entry_price": t.price,
                "exit_price": None,
                "entry_time": t.filled_time or t.placed_time,
                "exit_time": None,
                "realized_pnl": None,
                "duration": None,
                "broker": t.broker,
                "status": "open",
                "trade_ids": [t.id],
            })
            used.add(i)
    return grouped

@router.get("/api/completed-trades")
async def completed_trades(
    request: Request,
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
        result = await session.execute(q)
        trades = result.scalars().all()
        grouped = group_trades(trades)
        return {"completed_trades": grouped, "total": len(grouped)}
