from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.future import select
from db import AsyncSessionLocal
from datetime import datetime, timedelta
from finbert_sentiment import clean_tweet, analyze_sentiment
import re

Base = declarative_base()

class TrendingTweet(Base):
    __tablename__ = "trending_tweets"
    id = Column(Integer, primary_key=True)
    symbol = Column(String, index=True)
    text = Column(String)
    sentiment_label = Column(String)
    sentiment_score = Column(Float)
    timestamp = Column(DateTime, index=True)

# Utility: extract tickers from tweet text
TICKER_PATTERN = re.compile(r"\$([A-Za-z]{1,5})")
def extract_tickers(text):
    return list(set(m.group(1).upper() for m in TICKER_PATTERN.finditer(text)))

async def save_tweet_with_sentiment(raw_text, timestamp):
    tickers = extract_tickers(raw_text)
    if not tickers:
        return []
    cleaned = clean_tweet(raw_text)
    sentiment = analyze_sentiment(cleaned)
    async with AsyncSessionLocal() as session:
        records = []
        for symbol in tickers:
            tweet = TrendingTweet(
                symbol=symbol,
                text=cleaned[:280],
                sentiment_label=sentiment["label"],
                sentiment_score=sentiment["score"],
                timestamp=timestamp,
            )
            session.add(tweet)
            records.append(tweet)
        await session.commit()
        return records

async def get_trending_tickers(window_minutes=1440):
    now = datetime.utcnow()
    since = now - timedelta(minutes=window_minutes)
    since_24h = now - timedelta(hours=24)
    since_7d = now - timedelta(days=7)
    since_14d = now - timedelta(days=14)
    async with AsyncSessionLocal() as session:
        # All tweets in window
        q = select(TrendingTweet).where(TrendingTweet.timestamp >= since_7d)
        result = await session.execute(q)
        tweets_7d = result.scalars().all()
        # All tweets in previous 7d window (for baseline)
        q_prev = select(TrendingTweet).where(TrendingTweet.timestamp >= since_14d, TrendingTweet.timestamp < since_7d)
        result_prev = await session.execute(q_prev)
        tweets_prev_7d = result_prev.scalars().all()
    # Group by symbol
    def group_by_symbol(tweets):
        symbol_map = {}
        for t in tweets:
            s = t.symbol
            if s not in symbol_map:
                symbol_map[s] = []
            symbol_map[s].append(t)
        return symbol_map
    symbol_map_7d = group_by_symbol(tweets_7d)
    symbol_map_prev_7d = group_by_symbol(tweets_prev_7d)
    trending = []
    for symbol, group_7d in symbol_map_7d.items():
        # 7d and 24h
        group_24h = [t for t in group_7d if t.timestamp >= since_24h]
        mentions_24h = len(group_24h)
        mentions_7d = len(group_7d)
        # Baseline: previous 7d
        prev_7d = symbol_map_prev_7d.get(symbol, [])
        avg_mentions_7d = (len(prev_7d) / 7) if prev_7d else (mentions_7d / 7)
        spike_ratio = mentions_24h / avg_mentions_7d if avg_mentions_7d else 0
        # Sentiment
        pos = [t for t in group_24h if t.sentiment_label == "Positive"]
        neu = [t for t in group_24h if t.sentiment_label == "Neutral"]
        neg = [t for t in group_24h if t.sentiment_label == "Negative"]
        total = mentions_24h
        bullish_score = len(pos) / total if total else 0
        bearish_score = len(neg) / total if total else 0
        avg_score = sum(t.sentiment_score for t in group_24h) / total if total else 0
        def top_tweets(lst):
            return sorted(lst, key=lambda t: -t.sentiment_score)[:2]
        trending_score = (mentions_24h * 0.5) + (spike_ratio * 0.3) + (bullish_score * 0.2)
        trending.append({
            "symbol": symbol,
            "mentions_24h": mentions_24h,
            "mentions_7d": mentions_7d,
            "avg_mentions_7d": avg_mentions_7d,
            "spike_ratio": spike_ratio,
            "bullish_score": bullish_score,
            "bearish_score": bearish_score,
            "positive_pct": bullish_score * 100,
            "neutral_pct": len(neu) / total * 100 if total else 0,
            "negative_pct": bearish_score * 100,
            "avg_sentiment_score": avg_score,
            "top_tweets": [
                {"text": t.text, "sentiment": t.sentiment_label, "score": t.sentiment_score}
                for t in (top_tweets(pos) + top_tweets(neu) + top_tweets(neg))
            ],
            "trending_score": trending_score,
        })
    trending.sort(key=lambda x: -x["trending_score"])
    return trending
