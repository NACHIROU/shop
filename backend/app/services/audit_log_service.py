from app.db.mongo import audit_logs_collection
from app.models.audit_log import AuditLog
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

audit_collection = audit_logs_collection

class AuditLogService:
    @staticmethod
    async def log_action(
        admin_id: str,
        user_id: str,
        user_name: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None
    ):
        log = AuditLog(
            admin_id=admin_id,
            user_id=user_id,
            user_name=user_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            changes=changes
        )
        await audit_collection.insert_one(log.dict(by_alias=True))

    @staticmethod
    async def get_logs(
        merchant_id: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[dict]:
        query = {}
        if merchant_id:
            query["admin_id"] = merchant_id
        
        cursor = audit_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        logs = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "created_at" in doc and isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            logs.append(doc)
        return logs
