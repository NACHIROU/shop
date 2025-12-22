from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLogResponse(BaseModel):
    id: str
    admin_id: str
    user_id: str
    user_name: str
    action: str
    resource_type: str
    resource_id: str
    details: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    created_at: str

    class Config:
        orm_mode = True
