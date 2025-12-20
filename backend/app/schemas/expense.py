from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    date: datetime
    note: Optional[str] = None

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    note: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    amount: float
    category: str
    date: str
    note: Optional[str] = None
    created_at: str

class PaginatedExpenseResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    size: int
    pages: int
    total_amount: float = 0
