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
