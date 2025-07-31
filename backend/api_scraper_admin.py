from fastapi import APIRouter, HTTPException, Depends
from trending_tweets import save_tweet_with_sentiment
import snscrape.modules.twitter as sntwitter
from datetime import datetime, timedelta
from auth import get_current_user

router = APIRouter()

TICKERS = ["AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "GOOG", "META", "NFLX", "AMD", "SPY", "QQQ"]
QUERY = "(" + " OR ".join([f"${t}" for t in TICKERS]) + ") lang:en"

@router.post("/api/admin/run-scraper")
async def run_scraper(user=Depends(get_current_user)):
    # Only allow admin (username == 'admin')
    if user["username"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only.")
    since = (datetime.utcnow() - timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
    tweets = []
    for i, tweet in enumerate(sntwitter.TwitterSearchScraper(f'{QUERY} since:{since}').get_items()):
        if i >= 100:
            break
        tweets.append((tweet.content, tweet.date))
    count_saved = 0
    for text, dt in tweets:
        saved = await save_tweet_with_sentiment(text, dt)
        if saved:
            count_saved += len(saved)
    return {"success": True, "fetched": len(tweets), "saved": count_saved}
