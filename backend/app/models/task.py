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
    type: str  # "sale", "delivery", "client_visit", etc.
    title: str  # added
    description: Optional[str] = None  # added
    product_id: Optional[str] = None
    quantity: Optional[int] = None  # added
    client_name: Optional[str] = None  # added
    client_phone: Optional[str] = None  # added
    status: str  # "in_progress", "in_delivery", "completed", "cancelled"
    date: datetime
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # added

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
