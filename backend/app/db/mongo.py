from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
database = client[settings.database_name]

# Collections
users_collection = database["users"]
products_collection = database["products"]
suppliers_collection = database["suppliers"]
operations_collection = database["operations"]
expenses_collection = database["expenses"]
tasks_collection = database["tasks"]
notifications_collection = database["notifications"]
audit_logs_collection = database["audit_logs"]
categories_collection = database["categories"]

async def create_indexes():
    # Operations indexes
    await operations_collection.create_index([("admin_id", 1), ("type", 1), ("operation_date", -1)])
    await operations_collection.create_index([("operation_date", -1)])
    
    # Tasks indexes
    await tasks_collection.create_index([("admin_id", 1), ("status", 1), ("created_at", -1)])
    await tasks_collection.create_index([("admin_id", 1), ("updated_at", -1)])
    
    # Expenses indexes
    await expenses_collection.create_index([("admin_id", 1), ("date", -1)])
    
    # Products indexes
    await products_collection.create_index([("admin_id", 1), ("is_archived", 1)])
    
    # User indexes
    await users_collection.create_index([("role", 1), ("created_at", 1)])
    await users_collection.create_index([("email", 1)], unique=True)
