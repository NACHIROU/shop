from fastapi import APIRouter, Depends, Query, Body
from app.schemas.analytics import DailyOverview, MonthlyStats, DailyStats, GlobalStats
from app.services.analytics_service import AnalyticsService
from app.services.email_service import EmailService
from app.core.dependencies import get_current_admin_or_collaborator, get_current_superadmin
from app.models.user import User
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/global", response_model=GlobalStats)
async def get_global_stats(current_superadmin: User = Depends(get_current_superadmin)):
    return await AnalyticsService.get_global_stats()

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

@router.get("/report")
async def get_treasury_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    return await AnalyticsService.get_treasury_report(admin_id, start, end)

@router.post("/report/email")
async def email_treasury_report(
    email: str = Body(..., embed=True),
    start_date: str = Body(..., embed=True),
    end_date: str = Body(..., embed=True),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    report = await AnalyticsService.get_treasury_report(admin_id, start, end)
    
    # Format a simple HTML body
    summary = report["summary"]
    html_body = f"""
    <h1>Rapport de Trésorerie</h1>
    <p>Période: {start_date} au {end_date}</p>
    <ul>
        <li>Ventes: {summary['total_sales']} ({summary['sales_count']} ventes)</li>
        <li>Achats: {summary['total_purchases']} ({summary['purchases_count']} achats)</li>
        <li>Dépenses: {summary['total_expenses']} ({summary['expenses_count']} dépenses)</li>
        <li>Profit Opérationnel: {summary['operational_profit']}</li>
        <li>Profit Net: {summary['net_profit']}</li>
        <li>Solde Global: {summary['global_balance']}</li>
    </ul>
    """
    
    success = await EmailService.send_report_email(email, "Votre Rapport de Trésorerie", html_body)
    return {"success": success}

@router.get("/report/pdf")
async def get_treasury_report_pdf(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    from fastapi import Response
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    report = await AnalyticsService.get_treasury_report(admin_id, start, end)
    pdf_content = await AnalyticsService.generate_report_pdf(report)
    
    filename = f"rapport_tresorerie_{start_date[:10]}_{end_date[:10]}.pdf"
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
