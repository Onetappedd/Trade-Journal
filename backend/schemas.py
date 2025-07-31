from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AssetType(str, Enum):
    stock = "stock"
    option = "option"
    future = "future"

class TradeSide(str, Enum):
    buy = "buy"
    sell = "sell"

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    class Config:
        from_attributes = True  # Use this for Pydantic v2.x

class StrategyBase(BaseModel):
    name: str
    description: Optional[str] = None

class StrategyCreate(StrategyBase):
    pass

class Strategy(StrategyBase):
    id: int
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class TradeBase(BaseModel):
    strategy_id: Optional[int]
    entry_date: datetime
    exit_date: Optional[datetime]
    entry_price: float
    exit_price: Optional[float]
    quantity: float
    pnl: Optional[float]
    notes: Optional[str]
    attachment_url: Optional[str] = None
    review_status: Optional[str] = 'unreviewed'
    tag_ids: Optional[List[int]] = Field(default_factory=list)
    side: Optional[str] = None  # buy/sell direction

class StockTradeCreate(TradeBase):
    asset_type: AssetType = AssetType.stock
    ticker: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class OptionTradeCreate(TradeBase):
    asset_type: AssetType = AssetType.option
    ticker: str
    option_type: str
    strike: float
    expiry: datetime
    sector: Optional[str] = None
    industry: Optional[str] = None

class FutureTradeCreate(TradeBase):
    asset_type: AssetType = AssetType.future
    contract: str
    expiry: datetime

class Trade(TradeBase):
    id: int
    asset_type: AssetType
    sector: Optional[str] = None
    industry: Optional[str] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
