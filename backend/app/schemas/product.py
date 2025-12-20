from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    imei: str
    purchase_price: float
    category: str = "Autres"  # "iPhone", "Samsung", "Autres"
    stock: int = 0
    supplier_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    imei: Optional[str] = None
    purchase_price: Optional[float] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    supplier_id: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    imei: Optional[str] = None
    purchase_price: float
    stock: int  # computed
    category: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    created_at: str

class PaginatedProductResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    size: int
    pages: int
    total_value: float = 0
