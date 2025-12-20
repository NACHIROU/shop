from app.db.mongo import operations_collection, expenses_collection, tasks_collection
from app.schemas.analytics import DailyStats, MonthlyStats, DailyOverview
from datetime import datetime, timedelta
from typing import List

class AnalyticsService:
    @staticmethod
    async def get_daily_overview(admin_id: str) -> DailyOverview:
        today = datetime.utcnow().date()
        start_of_day = datetime(today.year, today.month, today.day)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Sales today
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
        sales = sales_result[0]["total"] if sales_result else 0
        
        # Expenses today
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        expenses = expenses_result[0]["total"] if expenses_result else 0
        
        # Profit = sales - expenses (simplified, should include purchases)
        profit = sales - expenses
        net_profit = profit
        
        # Tasks
        new_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "created_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        completed_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "completed",
            "updated_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        
        return DailyOverview(
            sales=sales,
            profit=profit,
            expenses=expenses,
            net_profit=net_profit,
            new_tasks=new_tasks,
            completed_tasks=completed_tasks
        )

    @staticmethod
    async def get_monthly_stats(admin_id: str) -> MonthlyStats:
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        # Total sales
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
        total_sales = sales_result[0]["total"] if sales_result else 0
        
        # Total expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        total_expenses = expenses_result[0]["total"] if expenses_result else 0
        
        # Profit calculation (simplified)
        total_profit = total_sales - total_expenses
        net_profit = total_profit
        
        # Tasks
        total_tasks = await tasks_collection.count_documents({"admin_id": admin_id, "created_at": {"$gte": start_of_month}})
        completed_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "completed",
            "created_at": {"$gte": start_of_month}
        })
        in_progress_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "in_progress",
            "created_at": {"$gte": start_of_month}
        })
        cancelled_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "cancelled",
            "created_at": {"$gte": start_of_month}
        })
        
        return MonthlyStats(
            total_sales=total_sales,
            total_profit=total_profit,
            total_expenses=total_expenses,
            net_profit=net_profit,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=in_progress_tasks,
            cancelled_tasks=cancelled_tasks
        )

    @staticmethod
    async def get_weekly_stats(admin_id: str) -> List[DailyStats]:
        now = datetime.utcnow()
        start_of_week = now - timedelta(days=7)
        
        stats = []
        for i in range(7):
            date = (start_of_week + timedelta(days=i)).date()
            start_of_day = datetime(date.year, date.month, date.day)
            end_of_day = start_of_day + timedelta(days=1)
            
            # Sales
            sales_pipeline = [
                {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
            sales = sales_result[0]["total"] if sales_result else 0
            
            # Profit (simplified)
            profit = sales
            
            # Tasks
            tasks = await tasks_collection.count_documents({
                "admin_id": admin_id,
                "created_at": {"$gte": start_of_day, "$lt": end_of_day}
            })
            
            # Expenses
            expenses_pipeline = [
                {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_day, "$lt": end_of_day}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
            expenses = expenses_result[0]["total"] if expenses_result else 0
            
            stats.append(DailyStats(
                date=date.isoformat(),
                sales=sales,
                profit=profit,
                tasks=tasks,
                expenses=expenses
            ))
        
        return stats
