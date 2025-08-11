from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd
import io
import re
import hashlib
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from auth import get_current_user, CurrentUser
from instruments import get_multiplier
from supabase_rest import (
    fetch_trades_paginated,
    fetch_trades_page,
    fetch_user_settings,
    fetch_cash_flows_paginated,
    bulk_insert_executions_staging,
    get_existing_dedupe_hashes,
    get_account_id_by_external,
    insert_import_errors,
    update_import_job,
)

app = FastAPI(title="TradeJournal Pro API", version="1.1.0")

# Simple in-memory cache with TTL
from time import time as _now
_CACHE: Dict[str, Tuple[float, Any]] = {}

def cache_get(key: str) -> Optional[Any]:
  ent = _CACHE.get(key)
  if not ent: return None
  exp, val = ent
  if _now() > exp:
    _CACHE.pop(key, None)
    return None
  return val

def cache_set(key: str, val: Any, ttl: int = 10) -> None:
  _CACHE[key] = (_now() + ttl, val)

security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Pydantic models
# ----------------------
class TradeCreate(BaseModel):
    symbol: str
    assetType: str
    broker: str
    entryDate: str
    exitDate: Optional[str] = None
    entryPrice: float
    exitPrice: Optional[float] = None
    quantity: int
    side: str
    notes: Optional[str] = ""
    tags: List[str] = []
    status: str = "open"

class TradeResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    assetType: str
    broker: str
    entryDate: str
    exitDate: Optional[str]
    entryPrice: float
    exitPrice: Optional[float]
    quantity: int
    side: str
    notes: str
    tags: List[str]
    status: str
    pnl: Optional[float]
    created_at: str

# Analytics contracts (shared)
class AnalyticsFilters(BaseModel):
    userId: str
    accountIds: Optional[List[str]] = None
    start: Optional[str] = None  # ISO date/time in user's TZ
    end: Optional[str] = None
    assetClasses: Optional[List[str]] = None  # ["stocks","options","futures"]
    strategies: Optional[List[str]] = None

class EquityCurvePoint(BaseModel):
    t: str
    equity: float

class MonthlyPnlPoint(BaseModel):
    month: str  # YYYY-MM
    realizedPnl: float
    fees: float
    netPnl: float
    tradeCount: int
    isProfitable: bool

class EquityCurveResponse(BaseModel):
    points: List[EquityCurvePoint]
    initialBalance: float
    finalBalance: float
    absoluteReturn: float
    pctReturn: float

class MonthlyPnlResponse(BaseModel):
    months: List[MonthlyPnlPoint]
    totals: Dict[str, float]

class CardsSummary(BaseModel):
    realizedPnl: float
    winRate: float
    avgWin: float
    avgLoss: float
    expectancy: float
    grossPnl: float
    fees: float
    netPnl: float
    tradeCount: int

class EquityCurveRequest(AnalyticsFilters):
    userTimezone: Optional[str] = None
    initialBalance: Optional[float] = None
    includeUnrealized: Optional[bool] = False

class MonthlyPnlRequest(AnalyticsFilters):
    userTimezone: Optional[str] = None

class CardsRequest(AnalyticsFilters):
    userTimezone: Optional[str] = None

class CostsRequest(AnalyticsFilters):
    userTimezone: Optional[str] = None

class FeesByGroup(BaseModel):
    group: str
    fees: float

class DteBucket(BaseModel):
    bucket: str
    tradeCount: int

class CostsResponse(BaseModel):
    fees: Dict[str, Any]
    slippage: Dict[str, Any]
    efficiency: Dict[str, Any]
    futures: Dict[str, Any]
    options: Dict[str, Any]
    totals: Dict[str, Any]

class TradesRequest(AnalyticsFilters):
    userTimezone: Optional[str] = None

class TradeOut(BaseModel):
    symbol: str
    assetClass: str
    side: Optional[str] = None
    quantity: float
    entryPrice: Optional[float] = None
    exitPrice: Optional[float] = None
    fees: Optional[float] = 0.0
    entryTime: Optional[str] = None
    exitTime: Optional[str] = None
    netPnl: Optional[float] = None
    returnPct: Optional[float] = None
    durationMinutes: Optional[float] = None

# ----------------------
# In-memory storage (replace with database)
# ----------------------
trades_db: Dict[str, Dict[str, Any]] = {}

# ----------------------
# Helpers
# ----------------------

def parse_iso(date_str: str) -> datetime:
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        # try date-only
        return datetime.strptime(date_str, "%Y-%m-%d")


def to_user_date(dt: datetime, tz: str) -> datetime:
    zone = ZoneInfo(tz)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(zone)


def start_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def normalized_trade_pnl(trade: Dict[str, Any]) -> Dict[str, float]:
    """Return dict with realized, fees, net using asset class multipliers."""
    entry = float(trade.get("entry_price") or trade.get("entryPrice") or 0)
    exitp = float(trade.get("exit_price") or trade.get("exitPrice") or 0)
    qty = float(trade.get("quantity") or 0)
    side = str(trade.get("side") or "buy").lower()
    asset_type = str(trade.get("asset_type") or trade.get("assetType") or "stock").lower()
    symbol = str(trade.get("symbol") or "")
    fees = float(trade.get("fees") or 0)

    # sign: buy -> +, sell -> short entry -> -
    sign = 1.0 if side == "buy" else -1.0
    raw = (exitp - entry) * qty * sign

    # multiplier by asset class/instrument
    if asset_type in ("stock", "stocks"):
        mult = 1.0
    elif asset_type in ("option", "options"):
        mult = get_multiplier("options", symbol)
    elif asset_type in ("futures", "future"):
        mult = get_multiplier("futures", symbol)
    else:
        mult = 1.0

    realized = raw * mult
    net = realized - fees
    return {"realized": realized, "fees": fees, "net": net}


def filter_and_collect_trades(user_id: str, creds: Optional[HTTPAuthorizationCredentials], body: AnalyticsFilters) -> List[Dict[str, Any]]:
    """Fetch trades via Supabase REST with pagination if possible, else fall back to in-memory."""
    if creds is not None:
        try:
            filters = {
                "userId": body.userId,
                "accountIds": body.accountIds,
                "start": body.start,
                "end": body.end,
                "assetClasses": body.assetClasses,
                "strategies": body.strategies,
            }
            trades = fetch_trades_paginated(creds.credentials, filters, limit=1000, max_pages=100)
            return trades
        except Exception:
            # Fallback to in-memory if Supabase not configured
            pass
    # Fallback in-memory filtering
    items = [t for t in trades_db.values() if t.get("user_id") == user_id]
    # date filter by exitDate/exist_date
    if body.start:
        sdt = parse_iso(body.start)
        items = [t for t in items if t.get("exitDate") and parse_iso(t["exitDate"]) >= sdt]
    if body.end:
        edt = parse_iso(body.end)
        items = [t for t in items if t.get("exitDate") and parse_iso(t["exitDate"]) <= edt]
    # asset class
    if body.assetClasses:
        aset = set([a.lower() for a in body.assetClasses])
        items = [t for t in items if str(t.get("assetType", "")).lower() in aset]
    # strategies
    if body.strategies:
        sset = set(body.strategies)
        items = [t for t in items if str(t.get("strategy") or "") in sset or any(tag in sset for tag in (t.get("tags") or []))]
    # closed only
    items = [t for t in items if t.get("status") == "closed" or t.get("exitDate")]
    return items

# ----------------------
# Basic routes
# ----------------------
@app.get("/")
async def root():
    return {"message": "TradeJournal Pro API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

# ----------------------
# CRUD mocks (in-memory)
# ----------------------
@app.post("/api/add-trade")
async def add_trade(
    trade: TradeCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Add a new trade for the authenticated user
    """
    try:
        # Calculate P&L if trade is closed
        pnl = None
        if trade.exitPrice and trade.entryPrice:
            if trade.side.lower() == "buy":
                pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity
            else:  # sell
                pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity

        # Create trade record
        trade_id = f"trade_{len(trades_db) + 1}"
        trade_record = {
            "id": trade_id,
            "user_id": current_user.user_id,
            "symbol": trade.symbol,
            "assetType": trade.assetType,
            "broker": trade.broker,
            "entryDate": trade.entryDate,
            "exitDate": trade.exitDate,
            "entryPrice": trade.entryPrice,
            "exitPrice": trade.exitPrice,
            "quantity": trade.quantity,
            "side": trade.side,
            "notes": trade.notes,
            "tags": trade.tags,
            "status": trade.status,
            "pnl": pnl,
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        trades_db[trade_id] = trade_record
        
        return {
            "message": "Trade added successfully",
            "trade": trade_record
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/trades")
async def get_trades(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get all trades for the authenticated user
    """
    user_trades = [
        trade for trade in trades_db.values() 
        if trade["user_id"] == current_user.user_id
    ]
    
    return {
        "trades": user_trades,
        "total": len(user_trades)
    }

@app.post("/api/import-trades")
async def import_trades(
    file: UploadFile = File(...),
    broker: str = "unknown",
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Import trades from CSV file for the authenticated user
    """
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        imported_trades = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Map CSV columns to trade fields (adjust based on your CSV format)
                trade_data = {
                    "symbol": str(row.get("Symbol", row.get("symbol", ""))).upper(),
                    "assetType": str(row.get("Asset Type", row.get("asset_type", "Stock"))),
                    "broker": broker,
                    "entryDate": str(row.get("Entry Date", row.get("entry_date", ""))),
                    "exitDate": str(row.get("Exit Date", row.get("exit_date", ""))) if pd.notna(row.get("Exit Date", row.get("exit_date"))) else None,
                    "entryPrice": float(row.get("Entry Price", row.get("entry_price", 0))),
                    "exitPrice": float(row.get("Exit Price", row.get("exit_price", 0))) if pd.notna(row.get("Exit Price", row.get("exit_price"))) else None,
                    "quantity": int(row.get("Quantity", row.get("quantity", 0))),
                    "side": str(row.get("Side", row.get("side", "Buy"))),
                    "notes": str(row.get("Notes", row.get("notes", ""))),
                    "tags": str(row.get("Tags", row.get("tags", ""))).split(",") if row.get("Tags", row.get("tags")) else [],
                    "status": "closed" if row.get("Exit Date", row.get("exit_date")) else "open"
                }
                
                # Calculate P&L
                pnl = None
                if trade_data["exitPrice"] and trade_data["entryPrice"]:
                    if trade_data["side"].lower() == "buy":
                        pnl = (trade_data["exitPrice"] - trade_data["entryPrice"]) * trade_data["quantity"]
                    else:
                        pnl = (trade_data["entryPrice"] - trade_data["exitPrice"]) * trade_data["quantity"]
                
                # Create trade record
                trade_id = f"trade_{len(trades_db) + len(imported_trades) + 1}"
                trade_record = {
                    "id": trade_id,
                    "user_id": current_user.user_id,
                    **trade_data,
                    "pnl": pnl,
                    "created_at": "2024-01-01T00:00:00Z"
                }
                
                trades_db[trade_id] = trade_record
                imported_trades.append(trade_record)
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        return {
            "message": f"Successfully imported {len(imported_trades)} trades",
            "imported": len(imported_trades),
            "errors": len(errors),
            "error_details": errors[:10]  # Return first 10 errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import trades: {str(e)}")

@app.put("/api/trades/{trade_id}")
async def update_trade(
    trade_id: str,
    trade: TradeCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update a specific trade for the authenticated user
    """
    if trade_id not in trades_db:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    existing_trade = trades_db[trade_id]
    if existing_trade["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this trade")
    
    # Update trade data
    pnl = None
    if trade.exitPrice and trade.entryPrice:
        if trade.side.lower() == "buy":
            pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity
        else:
            pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity
    
    updated_trade = {
        **existing_trade,
        "symbol": trade.symbol,
        "assetType": trade.assetType,
        "broker": trade.broker,
        "entryDate": trade.entryDate,
        "exitDate": trade.exitDate,
        "entryPrice": trade.entryPrice,
        "exitPrice": trade.exitPrice,
        "quantity": trade.quantity,
        "side": trade.side,
        "notes": trade.notes,
        "tags": trade.tags,
        "status": trade.status,
        "pnl": pnl
    }
    
    trades_db[trade_id] = updated_trade
    
    return {
        "message": "Trade updated successfully",
        "trade": updated_trade
    }

@app.delete("/api/trades/{trade_id}")
async def delete_trade(
    trade_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Delete a specific trade for the authenticated user
    """
    if trade_id not in trades_db:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    existing_trade = trades_db[trade_id]
    if existing_trade["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this trade")
    
    del trades_db[trade_id]
    
    return {"message": "Trade deleted successfully"}

@app.get("/api/user/profile")
async def get_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Get current user profile
    """
    return {
        "user_id": current_user.user_id,
        "email": current_user.email
    }

# ----------------------
# Cursor-based pagination for raw trades (removes ~1000 cap)
# ----------------------
@app.get("/api/trades-paginated")
async def get_trades_paginated(
    limit: int = 500,
    cursor: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Cursor-based pagination wrapper over Supabase PostgREST using Range headers.
    Request: ?limit=500&cursor=<opaque>
    Response: { items: Trade[], nextCursor?: string }
    """
    try:
        # Very simple cursor as encoded offset: base64("o=<offset>")
        offset = 0
        if cursor:
            try:
                import base64
                decoded = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
                if decoded.startswith("o="):
                    offset = int(decoded.split("=", 1)[1])
            except Exception:
                offset = 0
        items, next_cursor = fetch_trades_page(credentials.credentials, {"userId": current_user.user_id}, limit, offset)
        return {"items": items, "nextCursor": next_cursor}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------------
# Import detection endpoint
# ----------------------

def _norm_col(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (s or "").strip().lower())

# Simple Jaro-Winkler implementation for fuzzy matching
# Adapted minimal variant sufficient for header similarity

def _jaro_distance(s1: str, s2: str) -> float:
    s1 = s1 or ""; s2 = s2 or ""
    if s1 == s2:
        return 1.0
    len1 = len(s1)
    len2 = len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    max_dist = max(len1, len2) // 2 - 1
    match1 = [False] * len1
    match2 = [False] * len2
    matches = 0
    transpositions = 0
    # Count matches
    for i in range(len1):
        start = max(0, i - max_dist)
        end = min(i + max_dist + 1, len2)
        for j in range(start, end):
            if match2[j]:
                continue
            if s1[i] == s2[j]:
                match1[i] = True
                match2[j] = True
                matches += 1
                break
    if matches == 0:
        return 0.0
    # Count transpositions
    k = 0
    for i in range(len1):
        if not match1[i]:
            continue
        while not match2[k]:
            k += 1
        if s1[i] != s2[k]:
            transpositions += 1
        k += 1
    transpositions //= 2
    return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0


def _jaro_winkler(s1: str, s2: str, p: float = 0.1) -> float:
    j = _jaro_distance(s1, s2)
    # common prefix up to 4
    prefix = 0
    for i in range(min(4, len(s1), len(s2))):
        if s1[i] == s2[i]:
            prefix += 1
        else:
            break
    return j + prefix * p * (1.0 - j)


def _detect_decimal_warnings(sample_rows: list[dict]) -> list[str]:
    warn: list[str] = []
    # naive check for comma decimal like "1.234,56"
    for row in sample_rows[:50]:
        for v in row.values():
            if isinstance(v, str):
                s = v.strip()
                if re.search(r"\d{1,3}(?:[\.\s]\d{3})*,\d{2}$", s):
                    warn.append("Comma decimal detected; normalized to dot if needed")
                    return warn
    return warn


# Seed patterns (non-exhaustive)
_BROKER_PATTERNS = [
    {
        "brokerId": "ibkr",
        "assetClass": "stocks",
        "schemaId": "ibkr-trades-csv",
        "required": ["symbol", "quantity", "tprice", "datetime"],
        "optional": ["commfee", "proceeds", "basis", "realizedpl", "tradeid", "description", "assetcategory", "currency"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "tprice": "price",
            "cprice": "price",
            "datetime": "execTime",
            "commfee": "fees",
            "currency": "currency",
            "orderid": "orderId",
            "tradeid": "tradeIdExternal",
            "account": "accountIdExternal",
            "accountnumber": "accountIdExternal",
        },
    },
    {
        "brokerId": "ibkr",
        "assetClass": "options",
        "schemaId": "ibkr-trades-csv-options",
        "required": ["symbol", "quantity", "tprice", "datetime"],
        "optional": ["strike", "putcall", "expiration", "description", "commfee", "currency"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "tprice": "price",
            "datetime": "execTime",
            "commfee": "fees",
            "putcall": "right",
            "strike": "strike",
            "expiration": "expiry",
            "currency": "currency",
        },
    },
    {
        "brokerId": "ibkr",
        "assetClass": "futures",
        "schemaId": "ibkr-trades-csv-futures",
        "required": ["symbol", "quantity", "tprice", "datetime"],
        "optional": ["description", "commfee", "currency"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "tprice": "price",
            "datetime": "execTime",
            "commfee": "fees",
            "currency": "currency",
        },
    },
    {
        "brokerId": "schwab",
        "assetClass": "stocks",
        "schemaId": "schwab-trades-csv",
        "required": ["action", "symbol", "quantity", "price", "tradedate"],
        "optional": ["feescomm", "amount", "order", "accountnumber", "settlementdate"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "tradedate": "execTime",
            "feescomm": "fees",
            "order": "orderId",
            "accountnumber": "accountIdExternal",
        },
    },
    {
        "brokerId": "fidelity",
        "assetClass": "stocks",
        "schemaId": "fidelity-trades-csv",
        "required": ["symbol", "action", "quantity", "price", "settlementdate"],
        "optional": ["commission", "fees", "amount", "exchange", "description"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "settlementdate": "execTime",
            "commission": "fees",
            "fees": "fees",
        },
    },
    {
        "brokerId": "etrade",
        "assetClass": "stocks",
        "schemaId": "etrade-trades-csv",
        "required": ["transactiondate", "symbol", "quantity", "price"],
        "optional": ["commission", "fees", "amount", "action"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "transactiondate": "execTime",
            "commission": "fees",
            "fees": "fees",
        },
    },
    {
        "brokerId": "webull",
        "assetClass": "stocks",
        "schemaId": "webull-trades-csv",
        "required": ["symbol", "side", "quantity", "avgprice"],
        "optional": ["timeplaced", "timeexecuted", "commission", "regulatoryfees", "amount"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "avgprice": "price",
            "timeexecuted": "execTime",
            "commission": "fees",
            "regulatoryfees": "fees",
        },
    },
    {
        "brokerId": "robinhood",
        "assetClass": "stocks",
        "schemaId": "robinhood-trades-csv",
        "required": ["date", "symbol", "side", "quantity", "price"],
        "optional": ["time", "fees", "amount", "instrumenttype"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "date": "execTime",
            "fees": "fees",
        },
    },
    {
        "brokerId": "tastytrade",
        "assetClass": "options",
        "schemaId": "tastytrade-trades-csv",
        "required": ["filltime", "symbol", "quantity", "price"],
        "optional": ["fees", "commission", "netamount", "underlying", "description"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "filltime": "execTime",
            "fees": "fees",
            "commission": "fees",
            "underlying": "underlying",
        },
    },
    {
        "brokerId": "tradestation",
        "assetClass": "stocks",
        "schemaId": "tradestation-trades-csv",
        "required": ["executiondate", "symbol", "side", "quantity", "price"],
        "optional": ["commission", "secfee", "nfafee"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "executiondate": "execTime",
            "commission": "fees",
            "secfee": "fees",
            "nfafee": "fees",
        },
    },
    {
        "brokerId": "coinbase",
        "assetClass": "crypto",
        "schemaId": "coinbase-trades-csv",
        "required": ["timestamp", "product", "side", "size", "price"],
        "optional": ["fee", "feecurrency", "total", "orderid"],
        "map": {
            "product": "symbol",
            "size": "quantity",
            "price": "price",
            "timestamp": "execTime",
            "fee": "fees",
            "feecurrency": "currency",
            "orderid": "orderId",
        },
    },
    {
        "brokerId": "kraken",
        "assetClass": "crypto",
        "schemaId": "kraken-trades-csv",
        "required": ["timestamp", "market", "side", "amount", "price"],
        "optional": ["fee", "feecurrency", "total", "orderid"],
        "map": {
            "market": "symbol",
            "amount": "quantity",
            "price": "price",
            "timestamp": "execTime",
            "fee": "fees",
            "feecurrency": "currency",
        },
    },
    {
        "brokerId": "binanceus",
        "assetClass": "crypto",
        "schemaId": "binanceus-trades-csv",
        "required": ["timestamp", "symbol", "side", "quantity", "price"],
        "optional": ["fee", "feecurrency", "total", "orderid"],
        "map": {
            "symbol": "symbol",
            "quantity": "quantity",
            "price": "price",
            "timestamp": "execTime",
            "fee": "fees",
            "feecurrency": "currency",
        },
    },
]


def _score_candidate(file_headers: list[str], pattern: dict, user_hint: dict, sample_rows: list[dict]) -> tuple[float, dict[str, str], list[str]]:
    # Normalize headers
    norm_file_headers = [_norm_col(h) for h in file_headers]
    used_indices: set[int] = set()
    score = 0.0
    total = len(pattern.get("required", [])) + 0.5 * len(pattern.get("optional", []))
    header_map: dict[str, str] = {}

    # Helper to match expected -> best file header
    def best_match(expected: str) -> tuple[int | None, float]:
        e = _norm_col(expected)
        best_i = None
        best_sim = 0.0
        for i, fh in enumerate(norm_file_headers):
            sim = _jaro_winkler(e, fh)
            if sim > best_sim:
                best_sim = sim
                best_i = i
        return best_i, best_sim

    # Required headers
    for exp in pattern.get("required", []):
        idx, sim = best_match(exp)
        if idx is not None and sim >= 0.86:  # high confidence threshold
            if idx in used_indices:
                score -= 0.2  # ambiguous mapping penalty
            else:
                used_indices.add(idx)
                score += 1.0
                src_name = file_headers[idx]
                target = pattern.get("map", {}).get(exp, exp)
                header_map[src_name] = target

    # Optional headers
    for exp in pattern.get("optional", []):
        idx, sim = best_match(exp)
        if idx is not None and sim >= 0.86:
            if idx in used_indices:
                score -= 0.1
            else:
                used_indices.add(idx)
                score += 0.5
                src_name = file_headers[idx]
                target = pattern.get("map", {}).get(exp, exp)
                header_map[src_name] = target

    # Asset-specific cues: OCC code in description suggests options
    occ_in_desc = False
    for r in sample_rows[:50]:
        for key in r.keys():
            if _norm_col(key) in ("description", "description1", "desc"):
                val = str(r.get(key) or "")
                if re.search(r"\s\d{6}[CP]\d{8}$", val) or re.search(r"[A-Z]{1,5}\d{6}[CP]\d{8}$", val):
                    occ_in_desc = True
                    break
        if occ_in_desc:
            break
    if occ_in_desc and pattern.get("assetClass") == "options":
        score += 0.3

    # User hints boost
    if user_hint.get("brokerId") == pattern.get("brokerId"):
        score += 0.2
    if user_hint.get("assetClass") == pattern.get("assetClass"):
        score += 0.2

    # Normalize confidence to 0..1
    confidence = max(0.0, min(1.0, score / max(1.0, total)))

    warnings = _detect_decimal_warnings(sample_rows)
    return confidence, header_map, warnings


@app.post("/import/detect")
async def import_detect(
    file: UploadFile = File(...),
    userBrokerId: Optional[str] = Form(None),
    userAssetClass: Optional[str] = Form(None),
    userTimezone: Optional[str] = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Read first N rows + headers and run heuristics to detect broker/asset schema."""
    try:
        N = 200
        content = await file.read()
        headers: list[str] = []
        sample_rows: list[dict] = []

        # Try Excel first if extension suggests
        filename = file.filename or ""
        is_excel = filename.lower().endswith(".xlsx") or (file.content_type or "").endswith("excel")
        if is_excel:
            try:
                import pandas as pd
                import io as _io
                df = pd.read_excel(_io.BytesIO(content), nrows=N)
                headers = [str(c) for c in list(df.columns)]
                sample_rows = df.head(min(N, 50)).to_dict(orient="records")
            except Exception:
                # fallback to csv parsing
                is_excel = False
        if not is_excel:
            import pandas as pd
            import io as _io
            txt = content.decode("utf-8", errors="ignore")
            try:
                df = pd.read_csv(_io.StringIO(txt), nrows=N)
            except Exception:
                # try common alternatives
                try:
                    df = pd.read_csv(_io.StringIO(txt), nrows=N, sep=",", engine="python")
                except Exception:
                    df = pd.read_csv(_io.StringIO(txt), nrows=N, sep=";", engine="python")
            headers = [str(c) for c in list(df.columns)]
            sample_rows = df.head(min(N, 50)).to_dict(orient="records")

        if not headers:
            raise HTTPException(status_code=400, detail="Could not read file headers")

        # Evaluate patterns
        user_hint = {"brokerId": (userBrokerId or "").lower(), "assetClass": (userAssetClass or "").lower()}
        best = None
        best_conf = -1.0
        best_map = {}
        best_warnings: list[str] = []

        # Special-case: Webull options with headers like Total Qty / Filled Time
        if any(h.lower() == "total qty".lower() for h in headers) and any(h.lower() == "filled time".lower() for h in headers):
            user_hint = {"brokerId": user_hint.get("brokerId") or "webull", "assetClass": user_hint.get("assetClass") or "options"}

        for pat in _BROKER_PATTERNS:
            conf, hmap, warns = _score_candidate(headers, pat, user_hint, sample_rows)
            # Strengthen Webull match: map Total Qty -> quantity and Filled Time -> execTime
            if pat.get("brokerId") == "webull":
                for src in headers:
                    ns = src.strip().lower()
                    if ns == "total qty".lower():
                        hmap[src] = "quantity"
                    if ns == "filled time".lower():
                        hmap[src] = "execTime"
            if conf > best_conf or (abs(conf - best_conf) < 1e-6 and (
                (user_hint.get("brokerId") == pat.get("brokerId")) or (user_hint.get("assetClass") == pat.get("assetClass"))
            )):
                best_conf = conf
                best = pat
                best_map = hmap
                best_warnings = warns

        if not best:
            raise HTTPException(status_code=422, detail="No matching schema detected")

        return {
            "brokerGuess": best["brokerId"],
            "assetGuess": best["assetClass"],
            "schemaId": best["schemaId"],
            "confidence": float(round(best_conf, 4)),
            "headerMap": best_map,
            "warnings": best_warnings,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------------
# Import commit endpoint (batch streaming)
# ----------------------
class NormalizedFillIn(BaseModel):
    sourceBroker: str
    assetClass: str
    accountIdExternal: Optional[str] = None
    symbol: str
    underlying: Optional[str] = None
    expiry: Optional[str] = None
    strike: Optional[float] = None
    right: Optional[str] = None
    quantity: float
    price: float
    fees: Optional[float] = None
    currency: Optional[str] = None
    side: Optional[str] = None
    execTime: str
    orderId: Optional[str] = None
    tradeIdExternal: Optional[str] = None
    notes: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

class ImportCommitRequest(BaseModel):
    importJobId: str
    brokerId: str
    assetClass: str
    headerMap: Dict[str, str] = {}
    fills: List[NormalizedFillIn]
    skipInvalid: Optional[bool] = True


def _stable_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


@app.post("/import/commit")
async def import_commit(
    req: ImportCommitRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Accept a batch of normalized fills, dedupe by stable hash, and insert into staging.
    Client should send multiple batches of 2k-5k rows and aggregate server responses for progress.
    """
    user_jwt = credentials.credentials
    user_id = current_user.user_id

    inserted = 0
    duplicates = 0
    skipped = 0
    error_rows: List[Dict[str, Any]] = []

    to_insert: List[Dict[str, Any]] = []
    hashes: List[str] = []

    for idx, f in enumerate(req.fills):
        # Basic validation
        try:
            # Required
            if not f.symbol or f.quantity is None or f.price is None or not f.execTime:
                skipped += 1
                error_rows.append({
                    "row_number": idx + 1,
                    "error_message": "Missing required fields (symbol/quantity/price/execTime)",
                    "raw_data": json.dumps(f.raw or {})
                })
                continue
            # Parse time
            try:
                exec_dt = parse_iso(f.execTime)
            except Exception:
                skipped += 1
                error_rows.append({
                    "row_number": idx + 1,
                    "error_message": "Invalid execTime",
                    "raw_data": json.dumps(f.raw or {})
                })
                continue
            exec_iso = exec_dt.isoformat()

            # Resolve account id (optional)
            account_id: Optional[str] = None
            if f.accountIdExternal:
                try:
                    account_id = get_account_id_by_external(user_jwt, user_id, req.brokerId, f.accountIdExternal)
                except Exception:
                    account_id = None

            sym = (f.symbol or "").upper()
            qty = float(f.quantity)
            price = float(f.price)
            order_id = f.orderId or ""
            account_key = account_id or (f.accountIdExternal or "")

            # Stable dedupe hash: broker|account|time|symbol|qty|price|orderId
            key = f"{req.brokerId}|{account_key}|{exec_iso}|{sym}|{qty:.8f}|{price:.8f}|{order_id}"
            h = _stable_hash(key)
            hashes.append(h)

            to_insert.append({
                "import_job_id": req.importJobId,
                "user_id": user_id,
                "account_id": account_id,
                "broker_id": req.brokerId,
                "asset_class": req.assetClass,
                "exec_time": exec_iso,
                "symbol": sym,
                "underlying": f.underlying,
                "expiry": f.expiry,
                "strike": f.strike,
                "right": f.right,
                "quantity": qty,
                "price": price,
                "fees": abs(float(f.fees or 0.0)),
                "currency": f.currency,
                "side": f.side,
                "order_id": order_id or None,
                "trade_external_id": f.tradeIdExternal,
                "notes": f.notes,
                "raw": f.raw or {},
                "dedupe_hash": h,
            })
        except Exception as ex:
            skipped += 1
            error_rows.append({
                "row_number": idx + 1,
                "error_message": f"Validation error: {str(ex)}",
                "raw_data": json.dumps(getattr(f, "raw", {}) or {})
            })

    # Dedupe against existing staging rows
    existing = get_existing_dedupe_hashes(user_jwt, user_id, hashes)
    deduped_rows = [r for r in to_insert if r["dedupe_hash"] not in existing]
    duplicates = len(to_insert) - len(deduped_rows)

    # Bulk insert
    if deduped_rows:
        inserted = bulk_insert_executions_staging(user_jwt, deduped_rows)

    # Persist errors
    if error_rows:
        # Map to import_job_errors schema
        errs = [{
            "import_job_id": req.importJobId,
            "row_number": e.get("row_number"),
            "error_message": e.get("error_message"),
            "raw_data": e.get("raw_data"),
        } for e in error_rows]
        try:
            insert_import_errors(user_jwt, errs)
        except Exception:
            pass

    # Optional: update job status/progress (best-effort)
    try:
        update_import_job(user_jwt, req.importJobId, {"status": "running"})
    except Exception:
        pass

    return {"inserted": inserted, "duplicates": duplicates, "skipped": skipped, "errors": len(error_rows)}

# ----------------------
# Trades endpoint (per-trade rows for distributions/time analytics)
# ----------------------
@app.post("/analytics/trades", response_model=List[TradeOut])
async def analytics_trades(
    req: TradesRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if req.userId != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    tz = req.userTimezone or "America/New_York"
    trades = filter_and_collect_trades(current_user.user_id, credentials, req)

    out: List[TradeOut] = []
    for t in trades:
        # Extract fields with multiple key support
        symbol = str(t.get("symbol") or "").upper()
        asset_type = str(t.get("asset_type") or t.get("assetType") or "stock").lower()
        side = (t.get("side") or None)
        qty = float(t.get("quantity") or 0)
        entry = t.get("entry_price") or t.get("entryPrice")
        exitp = t.get("exit_price") or t.get("exitPrice")
        fees = float(t.get("fees") or 0.0)

        # Times: prefer *_time then *_date
        raw_entry_dt = t.get("entry_time") or t.get("entryTime") or t.get("entry_date") or t.get("entryDate")
        raw_exit_dt = t.get("exit_time") or t.get("exitTime") or t.get("exit_date") or t.get("exitDate")
        entry_dt = to_user_date(parse_iso(raw_entry_dt), tz) if raw_entry_dt else None
        exit_dt = to_user_date(parse_iso(raw_exit_dt), tz) if raw_exit_dt else None

        # Compute net pnl (normalized by multipliers if available via instruments in other endpoints; here use basic calculation)
        net = None
        retpct = None
        if entry is not None and exitp is not None:
            entry_f = float(entry)
            exit_f = float(exitp)
            # sign convention: buy>0, sell<0 assumed
            # realized before fees
            realized = (exit_f - entry_f) * qty
            net = realized - fees
            denom = abs(entry_f * qty) if entry_f and qty else None
            if denom and denom != 0:
                retpct = (net / denom) * 100.0

        dur_min = None
        if entry_dt and exit_dt:
            dur_min = (exit_dt - entry_dt).total_seconds() / 60.0

        out.append(TradeOut(
            symbol=symbol,
            assetClass=asset_type if asset_type != "stock" else "stocks",
            side=side,
            quantity=qty,
            entryPrice=float(entry) if entry is not None else None,
            exitPrice=float(exitp) if exitp is not None else None,
            fees=fees,
            entryTime=entry_dt.isoformat() if entry_dt else None,
            exitTime=exit_dt.isoformat() if exit_dt else None,
            netPnl=net,
            returnPct=retpct,
            durationMinutes=dur_min,
        ))

    return out

# ----------------------
# Analytics endpoints (single source of truth)
# ----------------------
@app.post("/analytics/equity-curve", response_model=EquityCurveResponse)
async def analytics_equity_curve(
    req: EquityCurveRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    # Ownership enforcement
    if req.userId != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    tz = req.userTimezone or "America/New_York"

    # Determine initial balance
    initial_balance = float(req.initialBalance or 0)
    if initial_balance == 0:
        try:
            settings = fetch_user_settings(credentials.credentials, current_user.user_id)
            if settings and settings.get("initial_capital") is not None:
                initial_balance = float(settings["initial_capital"])
        except Exception:
            pass
    if initial_balance == 0:
        initial_balance = 10000.0

    # Fetch trades
    raw_trades = filter_and_collect_trades(current_user.user_id, credentials, req)

    # Aggregate daily deltas (realized pnl - fees) by close date in user TZ
    daily: Dict[str, float] = {}
    first_close: Optional[datetime] = None
    last_close: Optional[datetime] = None

    for t in raw_trades:
        exit_date = t.get("exit_date") or t.get("exitDate")
        if not exit_date:
            continue
        dt = to_user_date(parse_iso(exit_date), tz)
        sod = start_of_day(dt)
        key = sod.isoformat()
        comps = normalized_trade_pnl(t)
        daily[key] = daily.get(key, 0.0) + comps["net"]
        if first_close is None or sod < first_close:
            first_close = sod
        if last_close is None or sod > last_close:
            last_close = sod

    # Include cash flows (deposits/withdrawals/fees adjustments) if table exists
    try:
        cf_filters = {
            "userId": req.userId,
            "accountIds": req.accountIds,
            "start": req.start,
            "end": req.end,
        }
        cash_flows = fetch_cash_flows_paginated(credentials.credentials, cf_filters, limit=1000, max_pages=100)
        for cf in cash_flows:
            cf_dt_raw = cf.get("date") or cf.get("created_at")
            if not cf_dt_raw:
                continue
            cf_dt = to_user_date(parse_iso(cf_dt_raw), tz)
            sod = start_of_day(cf_dt)
            key = sod.isoformat()
            amt = float(cf.get("amount") or 0.0)
            daily[key] = daily.get(key, 0.0) + amt
            if first_close is None or sod < first_close:
                first_close = sod
            if last_close is None or sod > last_close:
                last_close = sod
    except Exception:
        # If cash flows table not present or any error, skip silently
        pass

    # Determine calendar range
    if req.start:
        cal_start = start_of_day(to_user_date(parse_iso(req.start), tz))
    else:
        cal_start = first_close or start_of_day(to_user_date(datetime.utcnow(), tz))
    if req.end:
        cal_end = start_of_day(to_user_date(parse_iso(req.end), tz))
    else:
        cal_end = last_close or start_of_day(to_user_date(datetime.utcnow(), tz))

    if cal_end < cal_start:
        cal_end = cal_start

    # Build calendar and cumulative equity
    points: List[EquityCurvePoint] = []
    cumulative = 0.0
    cur = cal_start
    while cur <= cal_end:
        key = cur.isoformat()
        delta = daily.get(key, 0.0)
        cumulative += delta
        equity = initial_balance + cumulative
        points.append(EquityCurvePoint(t=key, equity=round(equity, 2)))
        cur = cur + timedelta(days=1)

    final_balance = points[-1].equity if points else initial_balance
    absolute_return = final_balance - initial_balance
    pct_return = (absolute_return / initial_balance) if initial_balance != 0 else 0.0

    return EquityCurveResponse(
        points=points,
        initialBalance=round(initial_balance, 2),
        finalBalance=round(final_balance, 2),
        absoluteReturn=round(absolute_return, 2),
        pctReturn=round(pct_return, 6),
    )


@app.post("/analytics/monthly-pnl", response_model=MonthlyPnlResponse)
async def analytics_monthly_pnl(
    req: MonthlyPnlRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if req.userId != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    tz = req.userTimezone or "America/New_York"

    trades = filter_and_collect_trades(current_user.user_id, credentials, req)

    # Establish calendar months in range
    if req.start:
        cal_start = start_of_day(to_user_date(parse_iso(req.start), tz))
    else:
        # default to 12 months back
        now = to_user_date(datetime.utcnow(), tz)
        cal_start = start_of_day((now.replace(day=1) - timedelta(days=365)))

    if req.end:
        cal_end = start_of_day(to_user_date(parse_iso(req.end), tz))
    else:
        cal_end = start_of_day(to_user_date(datetime.utcnow(), tz))

    # Round to first of month boundaries
    cal_start = cal_start.replace(day=1)
    cal_end = cal_end.replace(day=1)

    # Build months list
    months_keys: List[str] = []
    cur = cal_start
    while cur <= cal_end:
        months_keys.append(month_key(cur))
        # move to next month
        year = cur.year + (cur.month // 12)
        month = (cur.month % 12) + 1
        cur = cur.replace(year=year, month=month, day=1)

    # Aggregate by month
    month_buckets: Dict[str, Dict[str, Any]] = {k: {"realized": 0.0, "fees": 0.0, "net": 0.0, "count": 0} for k in months_keys}

    for t in trades:
        exit_date = t.get("exit_date") or t.get("exitDate")
        if not exit_date:
            continue
        dt = to_user_date(parse_iso(exit_date), tz)
        k = month_key(dt)
        if k not in month_buckets:
            # outside range; skip
            continue
        comps = normalized_trade_pnl(t)
        month_buckets[k]["realized"] += comps["realized"]
        month_buckets[k]["fees"] += comps["fees"]
        month_buckets[k]["net"] += comps["net"]
        month_buckets[k]["count"] += 1

    points: List[MonthlyPnlPoint] = []
    totals = {"realizedPnl": 0.0, "fees": 0.0, "netPnl": 0.0, "profitableMonths": 0.0, "losingMonths": 0.0, "avgMonthlyNet": 0.0}

    for k in months_keys:
        b = month_buckets[k]
        realized = round(b["realized"], 2)
        fees = round(b["fees"], 2)
        net = round(b["net"], 2)
        count = int(b["count"])
        profitable = net > 0
        points.append(MonthlyPnlPoint(month=k, realizedPnl=realized, fees=fees, netPnl=net, tradeCount=count, isProfitable=profitable))
        totals["realizedPnl"] += realized
        totals["fees"] += fees
        totals["netPnl"] += net
        if net > 0:
            totals["profitableMonths"] += 1
        elif net < 0:
            totals["losingMonths"] += 1

    visible_months = len(months_keys)
    totals["avgMonthlyNet"] = round((totals["netPnl"] / visible_months) if visible_months > 0 else 0.0, 2)

    # Round totals
    for key in ["realizedPnl", "fees", "netPnl", "profitableMonths", "losingMonths", "avgMonthlyNet"]:
        totals[key] = float(round(totals[key], 2))

    return MonthlyPnlResponse(months=points, totals=totals)


@app.post("/analytics/costs", response_model=CostsResponse)
async def analytics_costs(
    req: CostsRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if req.userId != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Cache key
    key = f"costs:{current_user.user_id}:{json.dumps(req.dict(), sort_keys=True)}"
    cached = cache_get(key)
    if cached is not None:
        return cached

    trades = filter_and_collect_trades(current_user.user_id, credentials, req)

    total_fees = 0.0
    commissions = 0.0
    regulatory = 0.0
    exchange = 0.0

    by_asset: Dict[str, float] = {}
    by_symbol: Dict[str, float] = {}

    # Best-effort extraction of fee components
    for t in trades:
        f = float(t.get("fees") or 0.0)
        total_fees += f
        # If specific components exist, sum them, else treat all as commissions
        commissions += float(t.get("commission") or 0.0) if (t.get("commission") is not None) else 0.0
        regulatory += float(t.get("regulatory_fees") or t.get("regulatoryFee") or 0.0) if (t.get("regulatory_fees") is not None or t.get("regulatoryFee") is not None) else 0.0
        exchange += float(t.get("exchange_fees") or t.get("exchangeFee") or 0.0) if (t.get("exchange_fees") is not None or t.get("exchangeFee") is not None) else 0.0
        if (t.get("commission") is None and t.get("regulatory_fees") is None and t.get("exchange_fees") is None and t.get("regulatoryFee") is None and t.get("exchangeFee") is None):
            commissions += f

        a = str(t.get("asset_type") or t.get("assetType") or "stocks").lower()
        s = str(t.get("symbol") or "").upper()
        by_asset[a] = by_asset.get(a, 0.0) + f
        by_symbol[s] = by_symbol.get(s, 0.0) + f

    fees_section = {
        "total": round(total_fees, 2),
        "commissions": round(commissions, 2),
        "regulatory": round(regulatory, 2),
        "exchange": round(exchange, 2),
        "byAssetClass": [{"group": k, "fees": round(v,2)} for k,v in by_asset.items()],
        "bySymbol": [{"group": k, "fees": round(v,2)} for k,v in sorted(by_symbol.items(), key=lambda kv: kv[1], reverse=True)[:50]],
    }

    # Slippage (supported only if fields exist)
    slippages_by_asset: Dict[str, list] = {}
    slippages_by_symbol: Dict[str, list] = {}
    supported_slip = False
    for t in trades:
        # Typical fields: slippage, limit_price/mark_price vs fill (not guaranteed)
        slip = t.get("slippage")
        if slip is None:
            lp = t.get("limit_price") or t.get("limitPrice")
            fp = t.get("exit_price") or t.get("exitPrice") or t.get("fill_price") or t.get("fillPrice")
            if lp is not None and fp is not None:
                try:
                    slip = float(fp) - float(lp)
                except Exception:
                    slip = None
        if slip is None:
            continue
        supported_slip = True
        a = str(t.get("asset_type") or t.get("assetType") or "stocks").lower()
        s = str(t.get("symbol") or "").upper()
        slippages_by_asset.setdefault(a, []).append(float(slip))
        slippages_by_symbol.setdefault(s, []).append(float(slip))

    def avg(vals: list[float]) -> float:
        return round(sum(vals)/len(vals), 4) if vals else 0.0

    slippage_section = {
        "supported": supported_slip,
        "byAssetClass": [{"group": k, "avg": avg(v)} for k,v in slippages_by_asset.items()],
        "bySymbol": [{"group": k, "avg": avg(v)} for k,v in slippages_by_symbol.items()][:50],
        "scatter": [],  # Fill later if size/slippage available
    }

    # Efficiency (requires OHLC/mark); not available => indicate unsupported
    efficiency_section = {
        "entry": {"supported": False},
        "exit": {"supported": False},
    }

    # Futures specifics
    fut_by_root: Dict[str, Dict[str, Any]] = {}
    fut_by_expiry: Dict[str, Dict[str, Any]] = {}
    for t in trades:
        a = str(t.get("asset_type") or t.get("assetType") or "stocks").lower()
        if a not in ("futures","future"):
            continue
        sym = str(t.get("symbol") or "").upper()
        # Root: leading letters
        import re as _re
        m = _re.match(r"^[A-Z]+", sym)
        root = m.group(0) if m else sym
        # Expiry from symbol or explicit expiry field
        expiry = str(t.get("expiry") or t.get("expiry_date") or "")
        d = fut_by_root.setdefault(root, {"netPnl": 0.0, "tradeCount": 0})
        d["tradeCount"] += 1
        # net approx from pnl fields if present else 0
        if t.get("pnl") is not None:
            try: d["netPnl"] += float(t.get("pnl") or 0.0)
            except: pass
        if expiry:
            de = fut_by_expiry.setdefault(expiry, {"netPnl": 0.0, "tradeCount": 0})
            de["tradeCount"] += 1
            if t.get("pnl") is not None:
                try: de["netPnl"] += float(t.get("pnl") or 0.0)
                except: pass

    futures_section = {
        "byRoot": [{"root": k, **{ "netPnl": round(v["netPnl"],2), "tradeCount": v["tradeCount"] }} for k,v in fut_by_root.items()],
        "byExpiry": [{"expiry": k, **{ "netPnl": round(v["netPnl"],2), "tradeCount": v["tradeCount"] }} for k,v in fut_by_expiry.items()],
    }

    # Options specifics: DTE buckets
    buckets = {"0-7":0, "8-30":0, "31-90":0, "90+":0}
    for t in trades:
        a = str(t.get("asset_type") or t.get("assetType") or "stocks").lower()
        if a not in ("options","option"):
            continue
        expiry_raw = t.get("expiry") or t.get("expiration")
        entry_raw = t.get("entry_time") or t.get("entryTime") or t.get("entry_date") or t.get("entryDate")
        if not expiry_raw or not entry_raw:
            continue
        try:
            exd = parse_iso(str(expiry_raw))
            etd = parse_iso(str(entry_raw))
            dte = (exd - etd).days
            if dte <= 7: buckets["0-7"] += 1
            elif dte <= 30: buckets["8-30"] += 1
            elif dte <= 90: buckets["31-90"] += 1
            else: buckets["90+"] += 1
        except Exception:
            continue

    options_section = {
        "byDteBucket": [{"bucket": k, "tradeCount": v} for k,v in buckets.items()],
        "byMoneyness": [],
        "supportedMoneyness": False,
    }

    result = {
        "fees": fees_section,
        "slippage": slippage_section,
        "efficiency": efficiency_section,
        "futures": futures_section,
        "options": options_section,
        "totals": {"feesTotal": round(total_fees, 2)},
    }

    cache_set(key, result, ttl=10)
    return result

@app.post("/analytics/cards", response_model=CardsSummary)
async def analytics_cards(
    req: CardsRequest,
    current_user: CurrentUser = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if req.userId != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    trades = filter_and_collect_trades(current_user.user_id, credentials, req)

    # Only closed trades contribute
    wins: List[float] = []
    losses: List[float] = []
    realized_sum = 0.0
    fees_sum = 0.0

    for t in trades:
        comps = normalized_trade_pnl(t)
        realized_sum += comps["realized"]
        fees_sum += comps["fees"]
        if comps["net"] > 0:
            wins.append(comps["net"])
        elif comps["net"] < 0:
            losses.append(comps["net"])  # negative values

    trade_count = len(trades)
    gross_pnl = sum(wins) + sum(losses)  # net before fees would be comps["realized"]
    net_pnl = realized_sum - fees_sum

    win_rate = (len(wins) / trade_count) * 100 if trade_count else 0.0
    avg_win = (sum(wins) / len(wins)) if wins else 0.0
    avg_loss = (sum(losses) / len(losses)) if losses else 0.0  # negative

    # Expectancy = (avgWin * winRate) - (avgLoss * (1 - winRate))
    wr = (len(wins) / trade_count) if trade_count else 0.0
    expectancy = (avg_win * wr) - (avg_loss * (1 - wr))

    return CardsSummary(
        realizedPnl=round(realized_sum, 2),
        winRate=round(win_rate, 2),
        avgWin=round(avg_win, 2),
        avgLoss=round(avg_loss, 2),
        expectancy=round(expectancy, 2),
        grossPnl=round(gross_pnl, 2),
        fees=round(fees_sum, 2),
        netPnl=round(net_pnl, 2),
        tradeCount=trade_count,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
