# Simple instruments/contracts metadata for multiplier-aware P&L normalization
# Extend or move to a database table in production.

from typing import Dict

Instrument = Dict[str, object]

# Keyed by root symbol or exact symbol depending on your convention
INSTRUMENTS: Dict[str, Instrument] = {
    # Futures examples
    "ES": {"asset_class": "futures", "point_value": 50, "tick_size": 0.25, "multiplier": 50, "currency": "USD"},
    "MES": {"asset_class": "futures", "point_value": 5, "tick_size": 0.25, "multiplier": 5, "currency": "USD"},
    "NQ": {"asset_class": "futures", "point_value": 20, "tick_size": 0.25, "multiplier": 20, "currency": "USD"},
    "MNQ": {"asset_class": "futures", "point_value": 2, "tick_size": 0.25, "multiplier": 2, "currency": "USD"},
    # Add more as needed
}

DEFAULTS = {
    "stocks": {"multiplier": 1},
    "options": {"multiplier": 100},  # US equity options default
    "futures": {"multiplier": 1},   # use INSTRUMENTS to override by symbol
}


def get_multiplier(asset_class: str, symbol: str | None) -> float:
    asset_class = (asset_class or "").lower()
    if asset_class == "options":
        return float(DEFAULTS["options"]["multiplier"])  # typically 100
    if asset_class == "stocks":
        return float(DEFAULTS["stocks"]["multiplier"])   # 1
    if asset_class == "futures":
        if not symbol:
            return float(DEFAULTS["futures"]["multiplier"])  # fallback 1
        sym = symbol.upper()
        # Try match by common futures roots first
        for root in INSTRUMENTS.keys():
            if sym.startswith(root):
                return float(INSTRUMENTS[root].get("multiplier", DEFAULTS["futures"]["multiplier"]))
        return float(DEFAULTS["futures"]["multiplier"])  # fallback 1
    # Unknown class fallback
    return 1.0
