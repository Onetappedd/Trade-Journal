import csv
import io
from typing import List, Dict, Any, Tuple
from datetime import datetime

# --- Trade Model (for demonstration, replace with your ORM/database model) ---
class Trade:
    def __init__(self, user_id: str, broker: str, symbol: str, side: str, qty: float, price: float, avg_price: float, status: str, placed_time: str, filled_time: str, raw: dict):
        self.user_id = user_id
        self.broker = broker
        self.symbol = symbol
        self.side = side
        self.qty = qty
        self.price = price
        self.avg_price = avg_price
        self.status = status
        self.placed_time = placed_time
        self.filled_time = filled_time
        self.raw = raw  # Store original row for reference
        # Add more fields as needed

# --- In-memory trade storage for demonstration (replace with DB) ---
TRADE_DB: List[Trade] = []

def trade_exists(user_id: str, broker: str, symbol: str, side: str, filled_time: str) -> bool:
    for t in TRADE_DB:
        if (
            t.user_id == user_id and t.broker == broker and t.symbol == symbol and t.side == side and t.filled_time == filled_time
        ):
            return True
    return False

# --- Webull CSV Parser ---
WEBULL_REQUIRED = [
    "Name", "Symbol", "Side", "Status", "Filled", "Total Qty", "Price", "Avg Price", "Time-in-Force", "Placed Time", "Filled Time"
]

def parse_webull_csv(content: str) -> Tuple[List[Dict[str, Any]], List[Tuple[int, str]]]:
    """
    Returns: (valid_rows, errors)
    valid_rows: list of dicts (parsed rows)
    errors: list of (row_number, error_message)
    """
    reader = csv.DictReader(io.StringIO(content))
    errors = []
    valid_rows = []
    if not reader.fieldnames:
        errors.append((0, "CSV file is empty or malformed."))
        return [], errors
    for field in WEBULL_REQUIRED:
        if field not in reader.fieldnames:
            errors.append((0, f"Missing required column: {field}"))
    if errors:
        return [], errors
    for i, row in enumerate(reader, start=2):  # start=2 for header row
        # Validate required fields
        missing = [f for f in WEBULL_REQUIRED if not row.get(f)]
        if missing:
            errors.append((i, f"Missing fields: {', '.join(missing)}"))
            continue
        try:
            # Convert fields
            qty = float(row["Total Qty"])
            price = float(row["Price"])
            avg_price = float(row["Avg Price"])
            # Optionally, parse/validate timestamps
            placed_time = row["Placed Time"]
            filled_time = row["Filled Time"]
            valid_rows.append({
                "symbol": row["Symbol"],
                "side": row["Side"],
                "qty": qty,
                "price": price,
                "avg_price": avg_price,
                "status": row["Status"],
                "placed_time": placed_time,
                "filled_time": filled_time,
                "raw": row
            })
        except Exception as e:
            errors.append((i, f"Malformed row: {str(e)}"))
    return valid_rows, errors

# --- (Optional) Robinhood CSV Parser ---
ROBINHOOD_REQUIRED = ["Symbol", "Side", "Quantity", "Price", "Date", "Time"]

def parse_robinhood_csv(content: str) -> Tuple[List[Dict[str, Any]], List[Tuple[int, str]]]:
    reader = csv.DictReader(io.StringIO(content))
    errors = []
    valid_rows = []
    if not reader.fieldnames:
        errors.append((0, "CSV file is empty or malformed."))
        return [], errors
    for field in ROBINHOOD_REQUIRED:
        if field not in reader.fieldnames:
            errors.append((0, f"Missing required column: {field}"))
    if errors:
        return [], errors
    for i, row in enumerate(reader, start=2):
        missing = [f for f in ROBINHOOD_REQUIRED if not row.get(f)]
        if missing:
            errors.append((i, f"Missing fields: {', '.join(missing)}"))
            continue
        try:
            qty = float(row["Quantity"])
            price = float(row["Price"])
            valid_rows.append({
                "symbol": row["Symbol"],
                "side": row["Side"],
                "qty": qty,
                "price": price,
                "date": row["Date"],
                "time": row["Time"],
                "raw": row
            })
        except Exception as e:
            errors.append((i, f"Malformed row: {str(e)}"))
    return valid_rows, errors

# --- Main Import Function ---
def import_trades_from_csv(user_id: str, broker: str, content: str) -> Dict[str, Any]:
    """
    Returns: dict with import summary
    """
    if broker == "webull":
        parsed, errors = parse_webull_csv(content)
    elif broker == "robinhood":
        parsed, errors = parse_robinhood_csv(content)
    else:
        return {"imported": 0, "skipped": 0, "errors": [(0, "Unsupported broker")]}
    imported = 0
    skipped = 0
    for row in parsed:
        # Deduplication: broker+symbol+side+filled_time
        if broker == "webull":
            unique_key = (user_id, broker, row["symbol"], row["side"], row["filled_time"])
        else:
            unique_key = (user_id, broker, row["symbol"], row["side"], row.get("date", "") + row.get("time", ""))
        if trade_exists(*unique_key):
            skipped += 1
            continue
        # Store trade (replace with DB insert)
        TRADE_DB.append(Trade(user_id=user_id, broker=broker, **row))
        imported += 1
    return {"imported": imported, "skipped": skipped, "errors": errors}
