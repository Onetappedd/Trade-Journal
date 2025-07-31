import csv
import io
from typing import List, Dict, Any, Tuple
from datetime import datetime

# --- Webull CSV Parser ---
WEBULL_REQUIRED = [
    "Name", "Symbol", "Side", "Status", "Filled", "Total Qty", "Price", "Avg Price", "Time-in-Force", "Placed Time", "Filled Time"
]

def parse_webull_csv(content: str) -> Tuple[List[Dict[str, Any]], List[Tuple[int, str]]]:
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
    # Fields that are truly required for a valid trade
    REQUIRED_FIELDS = [
        "Name", "Symbol", "Side", "Status", "Filled", "Total Qty", "Price", "Time-in-Force", "Placed Time"
    ]
    OPTIONAL_FIELDS = ["Avg Price", "Filled Time"]
    for i, row in enumerate(reader, start=2):
        missing = [f for f in REQUIRED_FIELDS if not row.get(f)]
        if missing:
            errors.append((i, f"Missing fields: {', '.join(missing)}"))
            continue
        try:
            qty = float(row["Total Qty"])
            # Clean price fields: remove leading @, $, and whitespace
            def clean_price(val):
                return float(str(val).lstrip("@$ ")) if val else None
            price = clean_price(row["Price"])
            avg_price = clean_price(row.get("Avg Price"))
            placed_time = row["Placed Time"]
            filled_time = row.get("Filled Time") or None
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
