from app.db.mongo import users_collection
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, CollaboratorCreate
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token
from fastapi import HTTPException
from datetime import timedelta
import secrets
import string

class AuthService:
    @staticmethod
    async def register_admin(user_data: UserCreate) -> dict:
        # Check if email already exists
        existing = await users_collection.find_one({"email": user_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = hash_password(user_data.password)
        user = User(
            role="admin",
            name=user_data.name,
            email=user_data.email,
            phone=user_data.phone,
            password_hash=hashed_password
        )
        result = await users_collection.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id
        
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            }
        }

    @staticmethod
    async def login(user_data: UserLogin) -> dict:
        user_doc = await users_collection.find_one({"email": user_data.email})
        if not user_doc or not verify_password(user_data.password, user_doc["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = User(**user_doc)
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            }
        }

    @staticmethod
    async def create_collaborator(admin_id: str, collab_data: CollaboratorCreate) -> User:
        # Check if email already exists
        existing = await users_collection.find_one({"email": collab_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Use provided password or generate temporary one
        if collab_data.password:
            hashed_password = hash_password(collab_data.password)
            must_change = False
        else:
            temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            hashed_password = hash_password(temp_password)
            must_change = True
        
        user = User(
            admin_id=admin_id,
            role=collab_data.role or "collaborator",
            name=collab_data.name,
            email=collab_data.email,
            phone=collab_data.phone,
            password_hash=hashed_password,
            must_change_password=must_change,
            is_active=True  # Active immediately if created by admin
        )
        result = await users_collection.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id
        
        return user

    @staticmethod
    async def change_password(user_id: str, new_password: str):
        hashed_password = hash_password(new_password)
        await users_collection.update_one(
            {"_id": user_id},
            {"$set": {"password_hash": hashed_password, "must_change_password": False, "is_active": True}}
        )

    @staticmethod
    async def get_users_by_admin(admin_id: str) -> list[User]:
        cursor = users_collection.find({"admin_id": admin_id, "role": "collaborator"})
        users = []
        async for doc in cursor:
            users.append(User(**doc))
        return users
