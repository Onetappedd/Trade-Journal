from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from auth import get_db, get_current_user
from models import Trade as TradeModel, FutureTrade, TradeTag, Tag
from schemas import Trade, FutureTradeCreate

router = APIRouter(prefix="/future", tags=["future"])

@router.post("/", response_model=Trade)
def create_future_trade(trade: FutureTradeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    trade_data = trade.dict(exclude={"tag_ids"})
    new_trade = FutureTrade(**trade_data, user_id=user.id)
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    for tag_id in trade.tag_ids:
        db.add(TradeTag(trade_id=new_trade.id, tag_id=tag_id))
    db.commit()
    return new_trade
