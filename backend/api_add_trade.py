from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel, validator
from db import AsyncSessionLocal
from models import Trade
from sqlalchemy.future import select
from auth import get_current_user
from datetime import datetime
import re

router = APIRouter()

class AddTradePayload(BaseModel):
    type: str
    symbol: str
    side: str
    qty: float
    entryPrice: float
    exitPrice: float | None = None
    entryTime: str
    exitTime: str | None = None
    broker: str
    status: str
    expiration: str | None = None
    strike: float | None = None
    optionType: str | None = None
    notes: str | None = None

    @validator('type')
    def type_valid(cls, v):
        if v not in ["Stock", "Option", "Future", "Crypto"]:
            raise ValueError("Invalid trade type.")
        return v
    @validator('side')
    def side_valid(cls, v):
        if v not in ["Buy", "Sell"]:
            raise ValueError("Side must be Buy or Sell.")
        return v
    @validator('qty')
    def qty_valid(cls, v):
        if v is None or v <= 0:
            raise ValueError("Quantity must be positive.")
        return v
    @validator('entryPrice')
    def entry_price_valid(cls, v):
        if v is None:
            raise ValueError("Entry price required.")
        return v
    @validator('entryTime')
    def entry_time_valid(cls, v):
        try:
            datetime.fromisoformat(v)
        except Exception:
            raise ValueError("Invalid entry time format.")
        return v
    @validator('status')
    def status_valid(cls, v):
        if v not in ["Filled", "Partial"]:
            raise ValueError("Status must be Filled or Partial.")
        return v
    @validator('broker')
    def broker_valid(cls, v):
        if not v:
            raise ValueError("Broker required.")
        return v
    @validator('expiration', always=True)
    def option_fields_required(cls, v, values):
        if values.get('type') == "Option":
            if not v:
                raise ValueError("Expiration required for options.")
            if not values.get('strike'):
                raise ValueError("Strike required for options.")
            if not values.get('optionType'):
                raise ValueError("Option type required for options.")
        return v

# Option symbol parser (Webull style)
def parse_option_symbol(symbol):
    match = re.match(r"([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d+)", symbol)
    if not match:
        return None, None, None, None
    ticker, yy, mm, dd, opt_type, strike_raw = match.groups()
    year = f"20{yy}"
    expiration = f"{year}-{mm}-{dd}"
    opt_type = "Call" if opt_type == "C" else "Put"
    strike = float(strike_raw) / 1000
    return ticker, expiration, opt_type, strike

@router.post("/api/add-trade")
async def add_trade(payload: AddTradePayload, user=Depends(get_current_user)):
    # Parse option symbol if needed
    ticker, expiration, option_type, strike = None, None, None, None
    if payload.type == "Option":
        t, e, o, s = parse_option_symbol(payload.symbol)
        ticker = t or payload.symbol
        expiration = e or payload.expiration
        option_type = o or payload.optionType
        strike = s or payload.strike
        if not (expiration and option_type and strike):
            raise HTTPException(status_code=400, detail="Invalid option symbol or missing option fields.")
    else:
        ticker = payload.symbol
    # Insert trade
    async with AsyncSessionLocal() as session:
        trade = Trade(
            user_id=int(user["sub"]),
            username=user["username"],
            broker=payload.broker,
            symbol=payload.symbol,
            type=payload.type,
            ticker=ticker,
            side=payload.side,
            qty=payload.qty,
            price=payload.entryPrice,
            avg_price=None,
            status=payload.status,
            placed_time=payload.entryTime,
            filled_time=payload.exitTime,
            expiration=expiration,
            strike=strike,
            option_type=option_type,
        )
        session.add(trade)
        await session.commit()
        await session.refresh(trade)
    return {"success": True, "trade_id": trade.id, "message": "Trade added successfully."}
