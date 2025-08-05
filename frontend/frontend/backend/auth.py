import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os

# Supabase JWT Secret
JWT_SECRET = "VVYQP8ca5BSNSbKi1LpVDsHlO1+0FwfwknwfHbjtSVG0W3RZPjJXYiJYfIaYrYAJ/EISp4HkEI/9NENa08qJuA=="
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

class CurrentUser:
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """
    Dependency to extract and verify Supabase JWT token
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # Decode and verify JWT
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False}  # Supabase tokens don't always have aud
        )
        
        # Extract user information
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail="Invalid token: missing user ID"
            )
        
        return CurrentUser(user_id=user_id, email=email)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, 
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401, 
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401, 
            detail=f"Authentication failed: {str(e)}"
        )

# Optional dependency for routes that can work with or without auth
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[CurrentUser]:
    """
    Optional dependency that returns None if no token is provided
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
