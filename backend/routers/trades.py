from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from auth import get_db, get_current_user
from models import Trade as TradeModel, StockTrade, OptionTrade, FutureTrade, TradeTag, Tag, AssetType
from schemas import Trade, StockTradeCreate, OptionTradeCreate, FutureTradeCreate

router = APIRouter(prefix="/trades", tags=["trades"])

@router.get("/", response_model=List[Trade])
def get_trades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Only return trades belonging to the current user
    return db.query(TradeModel).filter(TradeModel.user_id == user.id).offset(skip).limit(limit).all()

@router.get("/{trade_id}", response_model=Trade)
def get_trade(trade_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    trade = db.query(TradeModel).filter(TradeModel.id == trade_id, TradeModel.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found or not authorized")
    return trade

@router.get("/{trade_id}/vs_index")
def trade_vs_index(trade_id: int, db: Session = Depends(get_db), user=Depends(get_current_user), index: str = "SPY"):
    import yfinance as yf
    trade = db.query(TradeModel).filter(TradeModel.id == trade_id, TradeModel.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if not trade.entry_date or not trade.exit_date:
        raise HTTPException(status_code=400, detail="Trade must be closed (have entry and exit dates)")
    # Get trade return
    entry = float(trade.entry_price)
    exit = float(trade.exit_price)
    trade_return = ((exit - entry) / entry) * 100 if entry else 0
    # Get index return
    start = trade.entry_date.strftime("%Y-%m-%d")
    end = trade.exit_date.strftime("%Y-%m-%d")
    idx_hist = yf.Ticker(index).history(start=start, end=end)
    if idx_hist.empty:
        raise HTTPException(status_code=400, detail="No index data for period")
    idx_entry = float(idx_hist["Close"].iloc[0])
    idx_exit = float(idx_hist["Close"].iloc[-1])
    idx_return = ((idx_exit - idx_entry) / idx_entry) * 100 if idx_entry else 0
    outperformance = trade_return - idx_return
    return {
        "trade_return": trade_return,
        "index_return": idx_return,
        "outperformance": outperformance,
        "index": index
    }

@router.delete("/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    trade = db.query(TradeModel).filter(TradeModel.id == trade_id, TradeModel.user_id == user.id).first()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found or not authorized")
    db.delete(trade)
    db.commit()
    return {"ok": True}
