from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

class AuditLog(BaseModel):
    id: Optional[Any] = Field(alias="_id", default=None)
    admin_id: str  # The merchant shop owner
    user_id: str   # The person who performed the action (admin or collab)
    user_name: str
    action: str    # e.g., "create_product", "delete_task", "status_change"
    resource_type: str # e.g., "product", "task", "expense"
    resource_id: str
    details: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None # Before/After or just the diff
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
