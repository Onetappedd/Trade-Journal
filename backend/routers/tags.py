from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from auth import get_db, get_current_user
from models import Tag
from schemas import Tag, TagCreate

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("/", response_model=List[Tag])
def get_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Only return tags belonging to the current user
    return db.query(Tag).filter(Tag.user_id == user.id).offset(skip).limit(limit).all()

@router.post("/", response_model=Tag)
def create_tag(tag: TagCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_tag = db.query(Tag).filter(Tag.name == tag.name, Tag.user_id == user.id).first()
    if db_tag:
        raise HTTPException(status_code=400, detail="Tag already exists")
    new_tag = Tag(**tag.dict(), user_id=user.id)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag
