from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

class Task(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    admin_id: str
    collaborator_id: str
    type: str  # "vente", "troc", "delivery", "client_visit", etc.
    title: str
    description: Optional[str] = None
    product_id: Optional[str] = None
    quantity: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    status: str  # "in_progress", "in_delivery", "completed", "cancelled"
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
    is_archived: bool = False
    
    # Sale-specific fields
    selling_price: Optional[float] = None  # For "vente" type
    client: Optional[str] = None  # Customer name for sales
    
    # Trade-specific fields (for "troc" type)
    outgoing_product_id: Optional[str] = None  # Product being traded away
    outgoing_product_price: Optional[float] = None
    incoming_product_name: Optional[str] = None  # New product details
    incoming_product_imei: Optional[str] = None
    incoming_product_price: Optional[float] = None
    incoming_product_category: Optional[str] = None
    recovered_from: Optional[str] = None  # Person/source of incoming product
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
