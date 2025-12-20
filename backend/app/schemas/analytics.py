from pydantic import BaseModel
from typing import Optional

class DailyStats(BaseModel):
    date: str
    sales: float
    profit: float
    tasks: int
    expenses: float

class MonthlyStats(BaseModel):
    total_sales: float
    total_profit: float
    total_expenses: float
    net_profit: float
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    cancelled_tasks: int

class DailyOverview(BaseModel):
    sales: float
    profit: float
    expenses: float
    net_profit: float
    new_tasks: int
    completed_tasks: int