from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from auth import get_db, get_current_user
from models import Trade as TradeModel, StockTrade, TradeTag, Tag
from schemas import Trade, StockTradeCreate
import yfinance as yf

router = APIRouter(prefix="/stock", tags=["stock"])

@router.post("/", response_model=Trade)
def create_stock_trade(trade: StockTradeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    trade_data = trade.dict(exclude={"tag_ids"})
    # Fetch sector/industry from yfinance
    sector = None
    industry = None
    try:
        info = yf.Ticker(trade_data["ticker"]).info
        sector = info.get("sector")
        industry = info.get("industry")
    except Exception:
        pass
    new_trade = StockTrade(**trade_data, user_id=user.id, sector=sector, industry=industry)
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    # Handle tags
    for tag_id in trade.tag_ids:
        db.add(TradeTag(trade_id=new_trade.id, tag_id=tag_id))
    db.commit()
    return new_trade
