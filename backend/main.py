import os
import json
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
import requests
from dotenv import load_dotenv
from threading import Lock

# Load environment variables from .env file
load_dotenv()

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
if not API_KEY:
    raise RuntimeError("Alpha Vantage API key not found in environment or .env file.")

ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"
CACHE_FILE = "stock_cache.json"
CACHE_LOCK = Lock()

from api_import_trades import router as import_trades_router
from api_trades import router as trades_router
from auth import router as auth_router
from routers.analytics import router as analytics_router
from api_trending_tickers import router as trending_tickers_router
from api_completed_trades import router as completed_trades_router
from api_chart_data import router as chart_data_router
from api_trending_debug import router as trending_debug_router
from api_add_trade import router as add_trade_router
from api_scraper_admin import router as scraper_admin_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
# CORS middleware must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Routers must be included after CORS middleware
app.include_router(import_trades_router)
app.include_router(trades_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(trending_tickers_router)
app.include_router(completed_trades_router, prefix="/api")
app.include_router(chart_data_router)
app.include_router(trending_debug_router)
app.include_router(add_trade_router)
app.include_router(scraper_admin_router)

# Load cache from file (if exists)
def load_cache() -> Dict[str, Any]:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            try:
                return json.load(f)
            except Exception:
                return {}
    return {}

# Save cache to file
def save_cache(cache: Dict[str, Any]):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

# In-memory cache (loaded at startup)
cache = load_cache()

# Function to get stock data (with caching)
def get_stock_data(symbol: str) -> Dict[str, Any]:
    symbol = symbol.upper()
    with CACHE_LOCK:
        if symbol in cache:
            return cache[symbol]
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "outputsize": "compact",
        "apikey": API_KEY,
    }
    response = requests.get(ALPHA_VANTAGE_URL, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Alpha Vantage API error.")
    data = response.json()
    if "Time Series (Daily)" in data:
        time_series = data["Time Series (Daily)"]
        with CACHE_LOCK:
            cache[symbol] = time_series
            save_cache(cache)
        return time_series
    elif "Note" in data:
        raise HTTPException(status_code=429, detail="API rate limit reached. Please try again later.")
    elif "Error Message" in data:
        raise HTTPException(status_code=404, detail="Invalid symbol or API error.")
    else:
        raise HTTPException(status_code=500, detail="Unexpected API response.")

@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        data = get_stock_data(symbol)
        return {"symbol": symbol.upper(), "data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
