from pydantic import BaseModel
from typing import Optional, List

class DailyStats(BaseModel):
    date: str
    sales: float
    purchases: float = 0
    profit: float
    tasks: int
    expenses: float

    class Config:
        populate_by_name = True

class MonthlyStats(BaseModel):
    total_sales: float
    total_purchases: float = 0
    global_balance: float = 0
    total_profit: float
    total_expenses: float
    net_profit: float
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    cancelled_tasks: int
    total_value: float = 0

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class DailyOverview(BaseModel):
    sales: float
    purchases: float = 0
    global_balance: float = 0
    profit: float
    expenses: float
    net_profit: float
    new_tasks: int
    completed_tasks: int
    total_value: float = 0

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class MerchantStats(BaseModel):
    id: str
    name: str
    email: str
    total_sales: float
    active_tasks: int
    last_active: Optional[str] = None

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class GrowthData(BaseModel):
    date: str
    merchant_count: int
    volume: float

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class GlobalStats(BaseModel):
    total_merchants: int
    active_merchants_30d: int
    total_volume_all_time: float
    total_profit_all_time: float
    growth: List[GrowthData]
    top_merchants: List[MerchantStats]

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class CategoryStat(BaseModel):
    category: str
    sales: float
    profit: float
    count: int

class CategoryStatsResponse(BaseModel):
    categories: List[CategoryStat]
    total_sales: float
    total_profit: float
    total_count: int

class MonthlySummary(BaseModel):
    month_name: str
    month_key: str  # YYYY-MM
    sales: float
    purchases: float
    expenses: float
    profit: float # Operational profit
    net_profit: float
    tasks_completed: int
    global_balance: float

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))

class YearlySummaryResponse(BaseModel):
    summaries: List[MonthlySummary]

    class Config:
        populate_by_name = True
        alias_generator = lambda s: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(s.split('_')))