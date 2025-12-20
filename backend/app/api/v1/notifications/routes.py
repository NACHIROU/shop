from fastapi import APIRouter, Depends, HTTPException
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationResponse
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User
from typing import List

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(current_user: User = Depends(get_current_admin_or_collaborator)):
    return await NotificationService.get_notifications(str(current_user.id))

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: User = Depends(get_current_admin_or_collaborator)):
    await NotificationService.mark_as_read(notification_id, str(current_user.id))
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(current_user: User = Depends(get_current_admin_or_collaborator)):
    await NotificationService.mark_all_as_read(str(current_user.id))
    return {"status": "success"}
