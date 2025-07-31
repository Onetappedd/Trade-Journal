import asyncio
from datetime import datetime, timedelta
import snscrape.modules.twitter as sntwitter
from trending_tweets import save_tweet_with_sentiment

# How many tweets to fetch per run
TWEET_LIMIT = 500
# How far back to look (minutes)
LOOKBACK_MINUTES = 60

# Query for tweets containing $TICKER-like patterns (broader, more dynamic)
TICKERS = ["AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "GOOG", "META", "NFLX", "AMD", "SPY", "QQQ", "BABA", "INTC", "BA", "DIS", "JPM", "V", "PYPL", "SHOP", "PLTR", "COIN", "SOFI", "SNAP", "UBER", "LYFT", "CRM", "SQ", "ROKU", "F", "GM", "NIO", "XOM", "CVX", "T", "VZ", "WMT", "COST", "PEP", "KO", "MCD", "SBUX", "WFC", "GS", "TGT", "HD", "LOW", "LULU", "TSM", "ASML", "ADBE", "ORCL", "CSCO", "QCOM", "AVGO", "TXN", "AMAT", "MU", "ZM", "DOCU", "RBLX", "ABNB", "ETSY", "TWLO", "DDOG", "CRWD", "NET", "OKTA", "MDB", "ZS", "TEAM", "BIDU", "JD", "PDD", "LI", "XPEV", "BYD", "RIVN", "LCID", "ARKK", "ARKW", "ARKG", "SPCE", "GME", "AMC", "BBBY", "BB", "PLUG", "FSLR", "ENPH", "RUN", "SPLK", "PANW", "FTNT", "DOCN", "SIRI", "TLRY", "CGC", "ACB", "NOK", "ERIC", "SNY", "PFE", "MRNA", "BNTX", "CVAC", "GILD", "REGN", "VRTX", "BIIB", "LLY", "ABBV", "AZN", "JNJ", "UNH", "TMO", "DHR", "ISRG", "SYK", "BSX", "ZBH", "EW", "GMED", "ALGN", "DXCM", "IDXX", "MTD", "PKI", "BIO", "TECH", "A", "WAT", "BRKR", "QDEL", "HOLX", "ILMN", "EXAS", "GH", "NVCR", "TNDM", "PODD", "INSP", "SENS", "DXCM", "ABT", "MDT", "BDX", "BAX", "EW", "STE", "ZBH", "SYK", "BSX", "GMED", "ALGN", "ISRG", "IDXX", "MTD", "PKI", "BIO", "TECH", "A", "WAT", "BRKR", "QDEL", "HOLX", "ILMN", "EXAS", "GH", "NVCR", "TNDM", "PODD", "INSP", "SENS"]
QUERY = "(" + " OR ".join([f"${t}" for t in TICKERS]) + ") lang:en"

def get_recent_tweets():
    since = (datetime.utcnow() - timedelta(minutes=LOOKBACK_MINUTES)).strftime('%Y-%m-%dT%H:%M:%SZ')
    tweets = []
    for i, tweet in enumerate(sntwitter.TwitterSearchScraper(f'{QUERY} since:{since}').get_items()):
        if i >= TWEET_LIMIT:
            break
        tweets.append((tweet.content, tweet.date))
    return tweets

async def main():
    tweets = get_recent_tweets()
    print(f"Fetched {len(tweets)} tweets")
    count_saved = 0
    for text, dt in tweets:
        saved = await save_tweet_with_sentiment(text, dt)
        if saved:
            print(f"Saved tweet for tickers: {[t.symbol for t in saved]} at {dt}")
            count_saved += len(saved)
    print(f"Done saving {count_saved} tweets to trending_tweets.")
    if count_saved == 0:
        print("WARNING: No tweets were saved. Check query, DB connection, or scraping logic.")

if __name__ == "__main__":
    asyncio.run(main())
