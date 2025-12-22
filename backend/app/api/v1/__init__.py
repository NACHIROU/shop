from fastapi import APIRouter
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.products.routes import router as products_router
from app.api.v1.suppliers.routes import router as suppliers_router
from app.api.v1.tasks.routes import router as tasks_router
from app.api.v1.expenses.routes import router as expenses_router
from app.api.v1.analytics.routes import router as analytics_router
from app.api.v1.notifications.routes import router as notifications_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["expenses"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
