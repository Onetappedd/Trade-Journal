from fastapi import APIRouter, HTTPException, Request, status, Depends
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from db import AsyncSessionLocal
from models import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

print("[AUTH] DATABASE_URL:", os.getenv("DATABASE_URL"))
router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Registration endpoint
@router.post("/register")
async def register(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    username = data.get("username") or email.split("@")[0]
    # Normalize input
    email = email.lower().strip()
    if username:
        username = username.lower().strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    async with AsyncSessionLocal() as session:
        from sqlalchemy import or_, func
        filters = [func.lower(User.email) == email]
        if username:
            filters.append(func.lower(User.username) == username)
        print("Registering:", email, username)
        print("Duplicate check filters:", filters)
        q = select(User).where(or_(*filters))
        result = await session.execute(q)
        existing_user = result.scalars().first()
        print("Existing user found:", existing_user)
        if existing_user:
            print("Duplicate found, aborting registration.")
            raise HTTPException(status_code=400, detail="A user with that email or username already exists. Please use a different email/username or log in.")
        hashed_pw = pwd_context.hash(password)
        user = User(email=email, username=username, hashed_password=hashed_pw, created_at=datetime.utcnow())
        print("Inserting user:", user)
        session.add(user)
        try:
            await session.commit()
            print("User inserted and committed.")
        except IntegrityError as e:
            await session.rollback()
            print(f"IntegrityError: {e}")
            raise HTTPException(status_code=400, detail="A user with that email or username already exists. Please use a different email/username or log in.")
        return {"message": "Registration successful. Please log in."}

# Login endpoint
@router.post("/login")
async def login(request: Request):
    data = await request.json()
    identifier = data.get("email")  # can be email or username
    password = data.get("password")
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Email/Username and password required.")
    identifier = identifier.lower().strip()
    async with AsyncSessionLocal() as session:
        from sqlalchemy import or_, func
        q = select(User).where(
            or_(func.lower(User.email) == identifier, func.lower(User.username) == identifier)
        )
        result = await session.execute(q)
        user = result.scalars().first()
        # Try both possible password field names for compatibility
        user_password = getattr(user, 'password_hash', None) or getattr(user, 'hashed_password', None)
        if not user or not user_password or not pwd_context.verify(password, user_password):
            raise HTTPException(status_code=401, detail="Invalid email/username or password.")
        token = jwt.encode({"sub": str(user.id), "email": user.email, "username": user.username}, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"access_token": token, "token_type": "bearer", "username": user.username, "email": user.email}

# Dependency for protected routes
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

# Logout is handled on the frontend by clearing the token
