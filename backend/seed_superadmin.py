import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import hash_password
from datetime import datetime

import os
from dotenv import load_dotenv
load_dotenv()

async def seed_superadmin():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.shopmanager # based on config.py
    users_collection = db.users

    # Check if already exists
    existing = await users_collection.find_one({"email": "nachirousomad24@gmail.com"})
    if existing:
        print("SuperAdmin already exists")
        return

    superadmin = {
        "role": "superadmin",
        "name": "Super Admin",
        "email": "nachirousomad24@gmail.com",
        "phone": "0167581898",
        "password_hash": hash_password("Passw0rde"),
        "must_change_password": False,
        "is_active": True,
        "created_at": datetime.utcnow()
    }

    await users_collection.insert_one(superadmin)
    print("SuperAdmin created successfully!")

if __name__ == "__main__":
    asyncio.run(seed_superadmin())
