from pydantic import BaseModel
from typing import Optional

class DailyStats(BaseModel):
    date: str
    sales: float
    purchases: float = 0
    profit: float
    tasks: int
    expenses: float

class MonthlyStats(BaseModel):
    total_sales: float
    total_purchases: float = 0
    global_balance: float = 0
    total_profit: float  # This will represent operational profit
    total_expenses: float
    net_profit: float
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    cancelled_tasks: int

class DailyOverview(BaseModel):
    sales: float
    purchases: float = 0
    global_balance: float = 0
    profit: float  # This will represent operational profit
    expenses: float
    net_profit: float
    new_tasks: int
    completed_tasks: int