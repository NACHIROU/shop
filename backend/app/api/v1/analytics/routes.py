from fastapi import APIRouter, Depends
from app.schemas.analytics import DailyOverview, MonthlyStats, DailyStats
from app.services.analytics_service import AnalyticsService
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.get("/daily", response_model=DailyOverview)
async def get_daily_overview(current_user: User = Depends(get_current_admin_or_collaborator)):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await AnalyticsService.get_daily_overview(admin_id)

@router.get("/monthly", response_model=MonthlyStats)
async def get_monthly_stats(current_user: User = Depends(get_current_admin_or_collaborator)):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await AnalyticsService.get_monthly_stats(admin_id)

@router.get("/weekly", response_model=list[DailyStats])
async def get_weekly_stats(current_user: User = Depends(get_current_admin_or_collaborator)):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await AnalyticsService.get_weekly_stats(admin_id)
