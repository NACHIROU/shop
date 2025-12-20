from fastapi import Depends, HTTPException, status
from app.core.security import get_current_user
from app.schemas.auth import TokenData
from app.db.mongo import users_collection
from app.models.user import User
from bson import ObjectId

async def get_current_active_user(current_user: TokenData = Depends(get_current_user)) -> User:
    user = await users_collection.find_one({"_id": ObjectId(current_user.user_id), "is_active": True})
    if user is None:
        raise HTTPException(status_code=400, detail="Inactive user")
    return User(**user)

async def get_current_admin(current_user: TokenData = Depends(get_current_user)) -> User:
    user = await users_collection.find_one({"_id": ObjectId(current_user.user_id), "role": "admin", "is_active": True})
    if user is None:
        raise HTTPException(status_code=403, detail="Not an admin")
    return User(**user)

async def get_current_admin_or_collaborator(current_user: TokenData = Depends(get_current_user)) -> User:
    user = await users_collection.find_one({"_id": ObjectId(current_user.user_id), "is_active": True})
    if user is None:
        raise HTTPException(status_code=400, detail="Inactive user")
    return User(**user)
