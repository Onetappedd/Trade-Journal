from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
import yfinance as yf

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/options-chain/{ticker}")
def get_options_chain(ticker: str, user=Depends(get_current_user)):
    try:
        stock = yf.Ticker(ticker)
        expiries = stock.options
        chain = []
        for expiry in expiries:
            opt = stock.option_chain(expiry)
            for row in opt.calls.itertuples():
                chain.append({
                    "expiry": expiry,
                    "strike": row.strike,
                    "type": "call",
                    "symbol": row.contractSymbol,
                    "lastPrice": row.lastPrice,
                    "bid": row.bid,
                    "ask": row.ask,
                    "volume": row.volume,
                    "openInterest": row.openInterest,
                })
            for row in opt.puts.itertuples():
                chain.append({
                    "expiry": expiry,
                    "strike": row.strike,
                    "type": "put",
                    "symbol": row.contractSymbol,
                    "lastPrice": row.lastPrice,
                    "bid": row.bid,
                    "ask": row.ask,
                    "volume": row.volume,
                    "openInterest": row.openInterest,
                })
        return {"chain": chain}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch options chain: {e}")

@router.get("/crypto/{symbol}")
def get_crypto_data(symbol: str, user=Depends(get_current_user)):
    try:
        # yfinance uses e.g. BTC-USD
        yf_symbol = symbol.upper() + "-USD" if not symbol.upper().endswith("-USD") else symbol.upper()
        crypto = yf.Ticker(yf_symbol)
        info = crypto.info
        data = {
            "symbol": yf_symbol,
            "name": info.get("shortName") or info.get("name"),
            "price": info.get("regularMarketPrice"),
            "description": info.get("longBusinessSummary") or info.get("description"),
            "marketCap": info.get("marketCap"),
            "volume": info.get("volume24Hr") or info.get("volume"),
        }
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch crypto data: {e}")
