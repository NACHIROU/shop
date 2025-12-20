from fastapi import APIRouter, Depends, Query
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, PaginatedExpenseResponse
from app.services.expense_service import ExpenseService
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    expense = await ExpenseService.create_expense(admin_id, expense_data)
    return await ExpenseService.get_expense_by_id(str(expense.id), admin_id)

@router.get("/", response_model=PaginatedExpenseResponse)
async def get_expenses(
    start_date: str = Query(None),
    end_date: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ExpenseService.get_expenses(admin_id, start_date, end_date, page, size)

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ExpenseService.get_expense_by_id(expense_id, admin_id)

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ExpenseService.update_expense(expense_id, admin_id, expense_data)

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    await ExpenseService.delete_expense(expense_id, admin_id)
    return {"message": "Expense deleted successfully"}
