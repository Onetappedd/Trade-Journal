from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User as UserModel
from schemas import User as UserSchema, UserCreate
from auth import get_password_hash, authenticate_user, get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.post("/register", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    print("Hit create_user endpoint with:", user.dict())
    try:
        db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        new_user = UserModel(
            email=user.email,
            username=user.username,
            hashed_password=get_password_hash(user.password),
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print("Created new user:", new_user)
        return UserSchema.model_validate(new_user)
    except Exception as e:
        print("Exception in create_user:", e)
        raise

from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return UserSchema.model_validate(current_user)
    
@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    print("Hit create_user endpoint with:", user.dict())
    try:
        db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        new_user = UserModel(
            email=user.email,
            username=user.username,
            hashed_password=get_password_hash(user.password),
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print("Created new user:", new_user)
        return UserSchema.model_validate(new_user)
    except Exception as e:
        print("Exception in create_user:", e)
        raise