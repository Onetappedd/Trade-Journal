from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io
from auth import get_current_user, CurrentUser

app = FastAPI(title="TradeJournal Pro API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
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

# In-memory storage (replace with database)
trades_db = {}

@app.get("/")
async def root():
    return {"message": "TradeJournal Pro API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
