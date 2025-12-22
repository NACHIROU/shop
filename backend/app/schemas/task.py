from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # "vente", "troc", "delivery", "client_visit", etc.
    assigned_to: str  # collaborator_id
    product_id: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    date: Optional[datetime] = None  # Defaults to now if not provided
    
    # Sale-specific fields
    selling_price: Optional[float] = None
    client: Optional[str] = None
    
    # Trade-specific fields
    outgoing_product_id: Optional[str] = None
    outgoing_product_price: Optional[float] = None
    incoming_product_name: Optional[str] = None
    incoming_product_imei: Optional[str] = None
    incoming_product_price: Optional[float] = None
    incoming_product_category: Optional[str] = None
    recovered_from: Optional[str] = None

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
    selling_price: Optional[float] = None
    client: Optional[str] = None

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
    product_imei: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    date: str
    created_at: str
    updated_at: str
    
    # Sale-specific fields
    selling_price: Optional[float] = None
    client: Optional[str] = None
    
    # Trade-specific fields
    outgoing_product_id: Optional[str] = None
    outgoing_product_price: Optional[float] = None
    incoming_product_name: Optional[str] = None
    incoming_product_imei: Optional[str] = None
    incoming_product_price: Optional[float] = None
    incoming_product_category: Optional[str] = None
    recovered_from: Optional[str] = None
