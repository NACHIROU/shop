from passlib.context import CryptContext
from app.core.jwt import verify_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth import TokenData

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token.credentials)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    if user_id is None or role is None:
        raise credentials_exception
    return TokenData(user_id=user_id, role=role)
