from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, status, Depends
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from db import AsyncSessionLocal, Trade
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select
from sqlalchemy import and_
from trade_import import parse_webull_csv, parse_robinhood_csv
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()

def get_user_id_from_jwt(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid JWT: missing sub")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid JWT token")

@router.post("/api/import-trades")
async def import_trades(
    request: Request,
    file: UploadFile = File(...),
    broker: str = Form(...),
):
    user_id = get_user_id_from_jwt(request)
    try:
        content = await file.read()
        decoded = content.decode("utf-8-sig")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    # Parse CSV
    if broker.lower() == "webull":
        parsed, errors = parse_webull_csv(decoded)
    elif broker.lower() == "robinhood":
        parsed, errors = parse_robinhood_csv(decoded)
    else:
        return JSONResponse(status_code=400, content={"imported": 0, "skipped": 0, "errors": [(0, "Unsupported broker")]})

    imported = 0
    skipped = 0
    async with AsyncSessionLocal() as session:
        for row in parsed:
            # Deduplication: unique constraint on (user_id, broker, symbol, side, filled_time)
            exists_stmt = select(Trade).where(and_(
                Trade.user_id == user_id,
                Trade.broker == broker,
                Trade.symbol == row["symbol"],
                Trade.side == row["side"],
                Trade.filled_time == row["filled_time"]
            ))
            result = await session.execute(exists_stmt)
            if result.scalars().first():
                skipped += 1
                continue
            trade = Trade(
                user_id=user_id,
                broker=broker,
                symbol=row["symbol"],
                side=row["side"],
                qty=row["qty"],
                price=row["price"],
                avg_price=row.get("avg_price"),
                status=row.get("status"),
                placed_time=row.get("placed_time"),
                filled_time=row.get("filled_time"),
            )
            session.add(trade)
            try:
                await session.commit()
                imported += 1
            except IntegrityError:
                await session.rollback()
                skipped += 1
            except Exception as e:
                await session.rollback()
                errors.append((-1, f"DB error: {str(e)}"))
    summary = {"imported": imported, "skipped": skipped, "errors": errors}
    if imported == 0 and skipped == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "imported": 0,
                "skipped": 0,
                "errors": errors or [(-1, "No valid trades found or file format not recognized.")],
            },
        )
    return JSONResponse(summary)
