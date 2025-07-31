from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth import get_db, get_current_user
from models import User
from schemas import User as UserSchema
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/profile", tags=["profile"])

class UserProfileUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    # Add other updatable fields here (but NOT password or id)

@router.get("/", response_model=UserSchema)
def get_profile(user=Depends(get_current_user)):
    # Return the current user's profile (excluding sensitive fields)
    return user

@router.patch("/", response_model=UserSchema)
def update_profile(update: UserProfileUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Only allow updating allowed fields
    if update.username is not None:
        user.username = update.username
    if update.email is not None:
        user.email = update.email
    # Add more fields as needed
    db.commit()
    db.refresh(user)
    return user
