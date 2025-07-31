from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Trade
from auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/pnl")
def get_pnl(db: Session = Depends(get_db), user=Depends(get_current_user)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).all()
    total_pnl = sum([t.pnl or 0 for t in trades])
    return {"total_pnl": total_pnl}

@router.get("")
def get_analytics_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Placeholder summary structure for frontend compatibility
    return {
        "overall": {
            "total_trades": 0,
            "win_rate": 0,
            "avg_win": 0,
            "avg_loss": 0,
            "best_trade": None,
            "worst_trade": None,
            "avg_holding_time": "--"
        },
        "risk": {
            "max_drawdown": 0,
            "sharpe_ratio": None,
            "profit_factor": None
        },
        "benchmark_comparison": {
            "dates": [],
            "user_equity": [],
            "SPY": [],
            "QQQ": []
        },
        "time": [],
        "top_gainers": []
    }

@router.get("/winrate")
def get_winrate(db: Session = Depends(get_db), user=Depends(get_current_user)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).all()
    wins = sum(1 for t in trades if (t.pnl or 0) > 0)
    total = len(trades)
    win_rate = round(100 * wins / total, 2) if total > 0 else 0
    return {"win_rate": win_rate}
