import csv
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from db import AsyncSessionLocal
from models import Trade, User
from jose import jwt
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

WEBULL_REQUIRED = [
    "name", "symbol", "side", "status", "filled", "total_qty", "price", "avg_price", "time_in_force", "placed_time", "filled_time"
]

# Helper: normalize column names
def normalize_key(key):
    return key.strip().lower().replace(" ", "_").replace("-", "_")

# Helper: parse float safely
def parse_float(val):
    try:
        return float(str(val).replace("@", "").replace("$", "").strip())
    except Exception:
        return None

# Helper: parse datetime safely
def parse_datetime(val):
    for fmt in ("%m/%d/%Y %H:%M:%S %Z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(val.strip(), fmt)
        except Exception:
            continue
    return None

# Helper: get user_id from JWT
async def get_user_id_from_jwt(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload.get("sub")), payload.get("username")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid JWT token")

import re

# Option symbol parser (robust for Webull style)
from datetime import datetime as dt

def parse_option_symbol(symbol):
    # Webull/OCC style: e.g. SPXW250702P06185000
    match = re.match(r"^([A-Za-z]+)(\d{6})([CP])(\d{8})$", symbol)
    if match:
        ticker, exp_date, opt_type, strike_price = match.groups()
        try:
            expiration = dt.strptime(exp_date, "%y%m%d").date()
        except Exception:
            expiration = None
        try:
            strike = float(strike_price) / 1000
        except Exception:
            strike = None
        option_type = "call" if opt_type == "C" else "put"
        return ticker, expiration, strike, option_type
    return None, None, None, None

@router.post("/api/import-trades")
async def import_trades(
    request: Request,
    file: UploadFile = File(...),
    broker: str = Form(...),
    trade_type: str = Form("stock"),
    preview: bool = False,
):
    try:
        print("Received file:", file.filename)
        print("Broker selected:", broker)
        if not file:
            return JSONResponse(status_code=400, content={
                "success": False,
                "count": 0,
                "skipped": 0,
                "errors": [],
                "message": "No file uploaded."
            })
        if not broker:
            return JSONResponse(status_code=400, content={
                "success": False,
                "count": 0,
                "skipped": 0,
                "errors": [],
                "message": "No broker selected."
            })
        user_id, username = await get_user_id_from_jwt(request)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:  # 5MB limit
            return JSONResponse(status_code=400, content={
                "success": False,
                "count": 0,
                "skipped": 0,
                "errors": [],
                "message": "File too large. Please upload a file smaller than 5MB."
            })
        try:
            decoded = content.decode("utf-8-sig")
        except Exception as e:
            try:
                decoded = content.decode("utf-8")
            except Exception as e2:
                print("Error decoding file:", str(e2))
                return JSONResponse(status_code=400, content={
                    "success": False,
                    "count": 0,
                    "skipped": 0,
                    "errors": [],
                    "message": f"Could not decode file: {str(e2)}"
                })

        # --- Webull Parser ---
        def parse_webull(decoded):
            reader = csv.DictReader(io.StringIO(decoded))
            reader.fieldnames = [normalize_key(f) for f in reader.fieldnames]
            errors = []
            trades = []
            row_num = 1
            for row in reader:
                row_num += 1
                row = {normalize_key(k): v for k, v in row.items()}
                # Check for missing columns
                missing = [f for f in WEBULL_REQUIRED if f not in row or not row.get(f)]
                if missing:
                    errors.append((row_num, f"Missing fields: {', '.join(missing)}"))
                    continue
                # Skip canceled/rejected
                if row["status"].strip().lower() in ["canceled", "cancelled", "rejected"]:
                    errors.append((row_num, f"Skipped: status is {row['status']}."))
                    continue
                # Skip if qty or price is missing/zero
                qty = parse_float(row["total_qty"])
                price = parse_float(row["price"])
                if not qty or not price:
                    errors.append((row_num, "Skipped: missing or zero quantity/price."))
                    continue
                # Option symbol parsing
                trade_type = "option" if "option" in row["name"].lower() else "stock"
                ticker, expiration, opt_type, strike = None, None, None, None
                if trade_type == "option":
                    try:
                        ticker, expiration, opt_type, strike = parse_option_symbol(row["symbol"].upper())
                        if not (ticker and expiration and opt_type and strike):
                            raise ValueError("Could not parse option symbol.")
                    except Exception as e:
                        errors.append((row_num, f"Option symbol parse error: {str(e)}"))
                try:
                    trade_obj = dict(
                        user_id=user_id,
                        username=username,
                        broker="Webull",
                        symbol=row["symbol"].upper(),
                        type=trade_type,
                        ticker=ticker if trade_type == "option" else row["symbol"].upper(),
                        expiration=expiration,
                        strike=strike,
                        option_type=opt_type,
                        side=row["side"].lower(),
                        qty=qty,
                        price=price,
                        avg_price=parse_float(row["avg_price"]),
                        status=row["status"],
                        placed_time=row["placed_time"],
                        filled_time=row["filled_time"],
                    )
                    trades.append(trade_obj)
                except Exception as e:
                    errors.append((row_num, f"Malformed row: {str(e)}"))
            return trades, errors

        # --- Robinhood Parser ---
        def parse_robinhood(decoded):
            reader = csv.DictReader(io.StringIO(decoded))
            required = ["symbol", "quantity", "price", "side", "execution_date", "order_type"]
            reader.fieldnames = [normalize_key(f) for f in reader.fieldnames]
            errors = []
            trades = []
            row_num = 1
            for row in reader:
                row_num += 1
                row = {normalize_key(k): v for k, v in row.items()}
                missing = [f for f in required if not row.get(f)]
                if missing:
                    errors.append((row_num, f"Missing fields: {', '.join(missing)}"))
                    continue
                if row.get("order_type", "").lower() in ["cancelled", "canceled", "rejected"]:
                    continue
                try:
                    trade_obj = dict(
                        user_id=user_id,
                        username=username,
                        broker="Robinhood",
                        symbol=row["symbol"].upper(),
                        type="option" if "option" in row.get("symbol", "").lower() else "stock",
                        side=row["side"].lower(),
                        qty=parse_float(row["quantity"]),
                        price=parse_float(row["price"]),
                        avg_price=None,
                        status=row.get("order_type", ""),
                        placed_time=row.get("execution_date", ""),
                        filled_time=row.get("execution_date", ""),
                    )
                    trades.append(trade_obj)
                except Exception as e:
                    errors.append((row_num, f"Malformed row: {str(e)}"))
            return trades, errors

        # --- Broker Branching ---
        broker = broker.lower()
        print("Parsing started...")
        if broker == "webull":
            trades, errors = parse_webull(decoded)
            # For options, parse and normalize option symbols
            if trade_type == "options":
                for t in trades:
                    ticker, expiration, opt_type, strike = parse_option_symbol(t["symbol"])
                    t["ticker"] = ticker
                    t["expiration"] = expiration
                    t["option_type"] = opt_type
                    t["strike"] = strike
                    t["type"] = trade_type
            else:
                for t in trades:
                    t["type"] = trade_type
        elif broker == "robinhood":
            trades, errors = parse_robinhood(decoded)
            for t in trades:
                t["type"] = trade_type
        else:
            print("Unsupported broker:", broker)
            return JSONResponse(status_code=400, content={
                "success": False,
                "count": 0,
                "skipped": 0,
                "errors": [(0, "Unsupported broker")],
                "message": "Unsupported broker"
            })
        print(f"Parsed {len(trades)} trades, {len(errors)} errors in parsing.")
        if preview:
            return JSONResponse({
                "success": True,
                "preview": trades,
                "errors": errors
            })

        # Final import: insert to DB
        imported = 0
        skipped = 0
        try:
            async with AsyncSessionLocal() as session:
                for trade_dict in trades:
                    # Deduplication: unique constraint on (user_id, broker, symbol, side, filled_time)
                    q = select(Trade).where(
                        (Trade.user_id == user_id) &
                        (Trade.broker == trade_dict["broker"]) &
                        (Trade.symbol == trade_dict["symbol"]) &
                        (Trade.side == trade_dict["side"]) &
                        (Trade.filled_time == trade_dict["filled_time"])
                    )
                    result = await session.execute(q)
                    if result.scalars().first():
                        skipped += 1
                        continue
                    trade = Trade(**trade_dict)
                    session.add(trade)
                    try:
                        await session.commit()
                        imported += 1
                    except IntegrityError:
                        await session.rollback()
                        skipped += 1
                    except Exception as e:
                        await session.rollback()
                        errors.append((0, f"DB error: {str(e)}"))
            print(f"DB insert complete. Imported: {imported}, Skipped: {skipped}, Errors: {len(errors)}")
        except Exception as e:
            print("Error during DB insert:", str(e))
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "count": imported,
                    "skipped": skipped,
                    "errors": errors,
                    "message": f"DB error: {str(e)}"
                }
            )
        return JSONResponse({
            "success": True,
            "count": imported,
            "skipped": skipped,
            "errors": errors,
            "message": f"Imported {imported} trades, skipped {skipped}, {len(errors)} errors."
        })
    except Exception as e:
        print(f"Import error: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "count": 0,
                "skipped": 0,
                "errors": [],
                "message": f"Import failed: {str(e)}"
            }
        )
