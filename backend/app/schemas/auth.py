from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class CollaboratorCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "collaborator"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    created_at: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class CollaboratorResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    tasks_completed: int
    tasks_in_progress: int
    joined_at: str
