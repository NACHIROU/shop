from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    assigned_to: str  # collaborator_id
    product_id: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    date: datetime

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    assigned_to: Optional[str] = None
    product_id: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str
    status: str
    assigned_to: str
    assigned_to_name: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    date: str
    created_at: str
    updated_at: str
