from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OperationCreate(BaseModel):
    type: str
    product_id: Optional[str] = None
    supplier_id: Optional[str] = None
    quantity: Optional[int] = None
    amount: float
    operation_date: datetime
    note: Optional[str] = None

class OperationResponse(BaseModel):
    id: str
    type: str
    product_id: Optional[str] = None
    supplier_id: Optional[str] = None
    quantity: Optional[int] = None
    amount: float
    operation_date: str
    note: Optional[str] = None
    created_at: str
