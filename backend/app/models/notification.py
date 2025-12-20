from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .product import PyObjectId

class Notification(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    title: str
    message: str
    type: str  # "info", "task_completed", "low_stock", "new_task"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
        allow_population_by_field_name = True
