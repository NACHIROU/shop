from app.db.mongo import expenses_collection
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, PaginatedExpenseResponse
from typing import List
from fastapi import HTTPException

class ExpenseService:
    @staticmethod
    async def create_expense(admin_id: str, expense_data: ExpenseCreate) -> Expense:
        expense = Expense(
            admin_id=admin_id,
            category=expense_data.category,
            amount=expense_data.amount,
            date=expense_data.date,
            note=expense_data.note
        )
        result = await expenses_collection.insert_one(expense.dict(by_alias=True))
        expense.id = result.inserted_id
        return expense

    @staticmethod
    async def get_expenses(admin_id: str, start_date: str = None, end_date: str = None, page: int = 1, size: int = 50) -> PaginatedExpenseResponse:
        import math
        skip = (page - 1) * size
        query = {"admin_id": admin_id}
        if start_date and end_date:
            query["date"] = {"$gte": start_date, "$lte": end_date}
        
        total = await expenses_collection.count_documents(query)
        
        # Calculate total amount
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "total_amount": {"$sum": "$amount"}}}
        ]
        stats = await expenses_collection.aggregate(pipeline).to_list(length=1)
        total_amount = stats[0]["total_amount"] if stats else 0

        cursor = expenses_collection.find(query).skip(skip).limit(size)
        
        expenses = []
        async for doc in cursor:
            expense = Expense(**doc)
            expenses.append(ExpenseResponse(
                id=str(expense.id),
                amount=expense.amount,
                category=expense.category,
                date=expense.date.isoformat(),
                note=expense.note,
                created_at=expense.created_at.isoformat()
            ))
            
        return PaginatedExpenseResponse(
            items=expenses,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size),
            total_amount=total_amount
        )

    @staticmethod
    async def get_expense_by_id(expense_id: str, admin_id: str) -> ExpenseResponse:
        doc = await expenses_collection.find_one({"_id": expense_id, "admin_id": admin_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Expense not found")
        expense = Expense(**doc)
        return ExpenseResponse(
            id=str(expense.id),
            amount=expense.amount,
            category=expense.category,
            date=expense.date.isoformat(),
            note=expense.note,
            created_at=expense.created_at.isoformat()
        )

    @staticmethod
    async def update_expense(expense_id: str, admin_id: str, update_data: ExpenseUpdate) -> ExpenseResponse:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if update_dict:
            await expenses_collection.update_one(
                {"_id": expense_id, "admin_id": admin_id},
                {"$set": update_dict}
            )
        return await ExpenseService.get_expense_by_id(expense_id, admin_id)

    @staticmethod
    async def delete_expense(expense_id: str, admin_id: str):
        result = await expenses_collection.delete_one({"_id": expense_id, "admin_id": admin_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
