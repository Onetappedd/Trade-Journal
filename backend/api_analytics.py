from fastapi import APIRouter, Request, Depends
from sqlalchemy.future import select
from db import AsyncSessionLocal
from models import Trade
from auth import get_current_user
from datetime import datetime
from collections import defaultdict, Counter
import numpy as np

router = APIRouter()

def parse_dt(dt):
    try:
        return datetime.fromisoformat(dt)
    except Exception:
        return None

@router.get("/api/analytics")
async def analytics(request: Request, user=Depends(get_current_user)):
    user_id = int(user["sub"])
    async with AsyncSessionLocal() as session:
        q = select(Trade).where(Trade.user_id == user_id)
        result = await session.execute(q)
        trades = result.scalars().all()

    # --- Group trades into completed trades (round-trips) ---
    def group_trades(trades):
        trades = sorted(trades, key=lambda t: (t.symbol, t.filled_time or t.placed_time or "", t.side))
        grouped = []
        used = set()
        for i, t in enumerate(trades):
            if i in used or t.side not in ["buy", "sell"]:
                continue
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
                            duration = (dt2 - dt1).total_seconds() / 60  # in minutes
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

    completed = group_trades(trades)
    closed = [t for t in completed if t["status"] == "closed" and t["realized_pnl"] is not None]
    open_trades = [t for t in completed if t["status"] == "open"]

    # --- Overall Performance ---
    total_trades = len(closed)
    wins = [t for t in closed if t["realized_pnl"] > 0]
    losses = [t for t in closed if t["realized_pnl"] < 0]
    win_rate = len(wins) / total_trades if total_trades else 0
    avg_win = np.mean([t["realized_pnl"] for t in wins]) if wins else 0
    avg_loss = np.mean([t["realized_pnl"] for t in losses]) if losses else 0
    avg_pnl_per_trade = np.mean([t["realized_pnl"] for t in closed]) if closed else 0
    best_trade = max(closed, key=lambda t: t["realized_pnl"], default=None)
    worst_trade = min(closed, key=lambda t: t["realized_pnl"], default=None)
    avg_holding_time = np.mean([t["duration"] for t in closed if t["duration"] is not None]) if closed else 0
    # Format avg_holding_time as HH:MM
    avg_holding_time_fmt = f"{int(avg_holding_time//60)}h {int(avg_holding_time%60)}m" if avg_holding_time else "-"

    # --- Risk Metrics ---
    pnls = [t["realized_pnl"] for t in closed]
    equity_curve = np.cumsum(pnls) if pnls else []
    max_drawdown = 0
    if equity_curve is not None and len(equity_curve) > 1:
        peak = equity_curve[0]
        for x in equity_curve:
            if x > peak:
                peak = x
            dd = x - peak
            if dd < max_drawdown:
                max_drawdown = dd
    stddev = float(np.std(pnls)) if pnls else 0
    profit_factor = sum([p for p in pnls if p > 0]) / abs(sum([p for p in pnls if p < 0])) if sum([p for p in pnls if p < 0]) != 0 else None
    sharpe_ratio = (np.mean(pnls) / stddev) if stddev else None

    # --- Time-based Performance ---
    pnl_by_day = defaultdict(float)
    trades_by_day = Counter()
    win_by_day = Counter()
    for t in closed:
        dt = parse_dt(t["exit_time"]) or parse_dt(t["entry_time"]) or None
        if dt:
            day = dt.date().isoformat()
            pnl_by_day[day] += t["realized_pnl"]
            trades_by_day[day] += 1
            if t["realized_pnl"] > 0:
                win_by_day[day] += 1
    time_stats = [
        {"date": day, "pnl": pnl_by_day[day], "trades": trades_by_day[day], "win_rate": win_by_day[day]/trades_by_day[day] if trades_by_day[day] else 0}
        for day in sorted(pnl_by_day.keys())
    ]

    # --- Symbol & Strategy Performance ---
    symbol_stats = defaultdict(lambda: {"symbol": "", "win": 0, "loss": 0, "net_pnl": 0, "trades": 0})
    for t in closed:
        s = t["symbol"]
        symbol_stats[s]["symbol"] = s
        symbol_stats[s]["net_pnl"] += t["realized_pnl"]
        symbol_stats[s]["trades"] += 1
        if t["realized_pnl"] > 0:
            symbol_stats[s]["win"] += 1
        elif t["realized_pnl"] < 0:
            symbol_stats[s]["loss"] += 1
    symbol_stats_list = list(symbol_stats.values())
    for s in symbol_stats_list:
        s["win_rate"] = s["win"] / s["trades"] if s["trades"] else 0
    top_gainers = sorted(symbol_stats_list, key=lambda x: -x["net_pnl"])[:5]
    top_losers = sorted(symbol_stats_list, key=lambda x: x["net_pnl"])[:5]

    # --- Benchmark Comparison ---
    import requests, time as time_mod
    ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
    def fetch_alpha_vantage(symbol, start_date, end_date, max_retries=3):
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol={symbol}&outputsize=full&apikey={ALPHA_VANTAGE_API_KEY}"
        for attempt in range(max_retries):
            try:
                resp = requests.get(url, timeout=10)
                if resp.status_code != 200:
                    time_mod.sleep(2)
                    continue
                data = resp.json()
                if "Time Series (Daily)" not in data:
                    if "Note" in data:  # Rate limit
                        time_mod.sleep(15)
                        continue
                    return {}
                ts = data["Time Series (Daily)"]
                # Filter and sort by date
                filtered = {d: float(ts[d]["5. adjusted close"]) for d in ts if start_date <= d <= end_date}
                return dict(sorted(filtered.items()))
            except Exception:
                time_mod.sleep(2)
        return {}
    # Get trade dates
    all_dates = sorted({t["exit_time"][:10] for t in closed if t["exit_time"]} | {t["entry_time"][:10] for t in closed if t["entry_time"]})
    if all_dates:
        start_date, end_date = all_dates[0], all_dates[-1]
        spy = fetch_alpha_vantage("SPY", start_date, end_date)
        qqq = fetch_alpha_vantage("QQQ", start_date, end_date)
        # User equity curve
        equity = 10000
        user_equity = []
        date_to_pnl = {d: 0 for d in all_dates}
        for t in closed:
            dt = t["exit_time"][:10] if t["exit_time"] else t["entry_time"][:10]
            date_to_pnl[dt] += t["realized_pnl"]
        eq_curve = []
        for d in all_dates:
            equity += date_to_pnl[d]
            eq_curve.append(equity)
        # Normalize SPY/QQQ to 10k
        def normalize_curve(prices):
            if not prices: return []
            dates = sorted(prices.keys())
            start = prices[dates[0]]
            return [10000 * (prices[d]/start) for d in all_dates if d in prices]
        spy_curve = normalize_curve(spy)
        qqq_curve = normalize_curve(qqq)
        benchmark_comparison = {
            "dates": all_dates,
            "user_equity": eq_curve,
            "SPY": spy_curve,
            "QQQ": qqq_curve,
        }
    else:
        benchmark_comparison = {"dates": [], "user_equity": [], "SPY": [], "QQQ": []}

    return {
        "overall": {
            "total_trades": total_trades,
            "win_rate": win_rate,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "avg_pnl_per_trade": avg_pnl_per_trade,
            "best_trade": best_trade,
            "worst_trade": worst_trade,
            "avg_holding_time": avg_holding_time_fmt,
        },
        "risk": {
            "max_drawdown": max_drawdown,
            "sharpe_ratio": sharpe_ratio,
            "profit_factor": profit_factor,
            "pnl_stddev": stddev,
        },
        "time": time_stats,
        "symbols": symbol_stats_list,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "open_trades": open_trades,
        "benchmark_comparison": benchmark_comparison,
    }
