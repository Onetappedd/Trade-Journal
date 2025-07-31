from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from auth import get_db, get_current_user
from models import Trade as TradeModel, OptionTrade, TradeTag, Tag
from schemas import Trade, OptionTradeCreate
import yfinance as yf

router = APIRouter(prefix="/option", tags=["option"])

@router.post("/", response_model=Trade)
def create_option_trade(trade: OptionTradeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
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
    new_trade = OptionTrade(**trade_data, user_id=user.id, sector=sector, industry=industry)
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    for tag_id in trade.tag_ids:
        db.add(TradeTag(trade_id=new_trade.id, tag_id=tag_id))
    db.commit()
    return new_trade
