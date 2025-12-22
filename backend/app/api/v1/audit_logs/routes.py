from fastapi import APIRouter, Depends, Query
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_log_service import AuditLogService
from app.core.dependencies import get_current_superadmin
from app.models.user import User
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
async def get_all_logs(
    merchant_id: Optional[str] = Query(None),
    limit: int = Query(100),
    skip: int = Query(0),
    current_user: User = Depends(get_current_superadmin)
):
    return await AuditLogService.get_logs(merchant_id=merchant_id, limit=limit, skip=skip)
