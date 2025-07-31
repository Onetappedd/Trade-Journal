from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from auth import get_db, get_current_user
from models import Strategy
from schemas import Strategy, StrategyCreate

router = APIRouter(prefix="/strategies", tags=["strategies"])

@router.get("/", response_model=List[Strategy])
def get_strategies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Only return strategies belonging to the current user
    return db.query(Strategy).filter(Strategy.user_id == user.id).offset(skip).limit(limit).all()

@router.post("/", response_model=Strategy)
def create_strategy(strategy: StrategyCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_strategy = db.query(Strategy).filter(Strategy.name == strategy.name, Strategy.user_id == user.id).first()
    if db_strategy:
        raise HTTPException(status_code=400, detail="Strategy already exists")
    new_strategy = Strategy(**strategy.dict(), user_id=user.id)
    db.add(new_strategy)
    db.commit()
    db.refresh(new_strategy)
    return new_strategy
