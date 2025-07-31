import pandas as pd
from pydantic import BaseModel

class TradeFeatures(BaseModel):
    moving_average_50: float
    moving_average_200: float
    rsi: float

def predict(features: TradeFeatures) -> dict:
    """Mock prediction function."""
    score = 0
    if features.moving_average_50 > features.moving_average_200:
        score += 0.5
    if features.rsi > 70:
        score -= 0.2
    elif features.rsi < 30:
        score += 0.2
    return {"confidence_score": min(1, max(0, score))}
