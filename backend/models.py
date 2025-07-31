from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    # Add more fields as needed

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    strategy_id = Column(Integer, nullable=True, index=True)
    asset_type = Column(String, nullable=True)
    broker = Column(String, nullable=True)
    entry_date = Column(String, nullable=True)
    exit_date = Column(String, nullable=True)
    entry_price = Column(Float, nullable=True)
    exit_price = Column(Float, nullable=True)
    quantity = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)
    review_status = Column(String, nullable=True)
    side = Column(String, nullable=True)
    type = Column(String, nullable=True)
    ticker = Column(String, nullable=True)
    expiration = Column(String, nullable=True)
    strike = Column(Float, nullable=True)
    option_type = Column(String, nullable=True)
    __table_args__ = (
        UniqueConstraint('user_id', 'strategy_id', 'ticker', 'side', 'entry_date', name='uq_trade_dedupe'),
    )

class TrendingTweet(Base):
    __tablename__ = "trending_tweets"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(16), index=True)
    text = Column(String)
    sentiment_label = Column(String(16))
    sentiment_score = Column(Float)
    timestamp = Column(DateTime, index=True)
