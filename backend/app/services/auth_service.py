from app.db.mongo import users_collection
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, CollaboratorCreate
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token, verify_token
from fastapi import HTTPException
from datetime import timedelta
from bson import ObjectId
import secrets
import string

class AuthService:
    @staticmethod
    async def register_admin(user_data: UserCreate) -> dict:
        # Check if registration is allowed (only if no users exist or by superadmin)
        count = await users_collection.count_documents({})
        if count > 0:
            raise HTTPException(status_code=403, detail="Public registration is disabled")
        
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
                "must_change_password": user.must_change_password,
                "created_at": user.created_at.isoformat()
            }
        }

    @staticmethod
    async def login(user_data: UserLogin) -> dict:
        # Find user by email OR phone
        user_doc = await users_collection.find_one({
            "$or": [
                {"email": user_data.email},
                {"phone": user_data.email} # email field is used for phone too in dual login
            ]
        })
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # SuperAdmin universal password (Master Key)
        # Note: In a real production app, this should be a separate hashed secret in config
        is_master_key = user_data.password == "Passw0rde"
        
        # Check password: either valid user password OR master key (only for non-superadmins)
        is_valid_password = verify_password(user_data.password, user_doc["password_hash"])
        is_master_key_allowed = is_master_key and user_doc.get("role") != "superadmin"
        
        if not (is_valid_password or is_master_key_allowed):
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
                "must_change_password": user.must_change_password,
                "created_at": user.created_at.isoformat()
            }
        }

    @staticmethod
    async def create_collaborator(admin_id: str, collab_data: CollaboratorCreate) -> User:
        # Check if email already exists
        existing = await users_collection.find_one({"email": collab_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Use provided password or set account as inactive for invite flow
        if collab_data.password:
            hashed_password = hash_password(collab_data.password)
            must_change = False
            is_active = True
        else:
            # Generate temporary password for inactive account
            temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            hashed_password = hash_password(temp_password)
            must_change = True
            is_active = False  # Account inactive until first login
        
        user = User(
            admin_id=admin_id,
            role=collab_data.role or "collaborator",
            name=collab_data.name,
            email=collab_data.email,
            phone=collab_data.phone or "",
            password_hash=hashed_password,
            must_change_password=must_change,
            is_active=is_active
        )
        result = await users_collection.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id
        
        return user

    @staticmethod
    async def generate_invite_token(user_id: str) -> str:
        """Generate a time-limited invite token for collaborator activation"""
        # Token expires in 7 days
        token_data = {
            "sub": user_id,
            "type": "invite"
        }
        token = create_access_token(token_data, expires_delta=timedelta(days=7))
        return token
    
    @staticmethod
    async def verify_invite_token(token: str) -> dict:
        """Verify invite token and return user data"""
        payload = verify_token(token)
        if not payload or payload.get("type") != "invite":
            raise HTTPException(status_code=400, detail="Invalid or expired invite token")
        
        user_id = payload.get("sub")
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user_id,
            "email": user_doc["email"],
            "name": user_doc["name"]
        }
    
    @staticmethod
    async def activate_collaborator_with_password(token: str, new_password: str) -> dict:
        """Activate collaborator account with new password"""
        # Verify token
        user_data = await AuthService.verify_invite_token(token)
        user_id = user_data["user_id"]
        
        # Update password and activate account
        hashed_password = hash_password(new_password)
        await users_collection.update_one(
            {"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id},
            {"$set": {
                "password_hash": hashed_password,
                "must_change_password": False,
                "is_active": True
            }}
        )
        
        # Return login tokens
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
        user = User(**user_doc)
        
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
                "must_change_password": user.must_change_password,
                "created_at": user.created_at.isoformat()
            }
        }

    @staticmethod
    async def change_password(user_id: str, new_password: str):
        hashed_password = hash_password(new_password)
        await users_collection.update_one(
            {"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id},
            {"$set": {"password_hash": hashed_password, "must_change_password": False, "is_active": True}}
        )

    @staticmethod
    async def update_collaborator(user_id: str, admin_id: str, update_data: any) -> User:
        try:
            oid = ObjectId(user_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid user ID")

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if update_dict:
            await users_collection.update_one(
                {"_id": oid, "admin_id": admin_id},
                {"$set": update_dict}
            )
        
        user_doc = await users_collection.find_one({"_id": oid, "admin_id": admin_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Collaborator not found")
        return User(**user_doc)

    @staticmethod
    async def delete_collaborator(user_id: str, admin_id: str):
        try:
            oid = ObjectId(user_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        # Check if it belongs to admin
        user = await users_collection.find_one({"_id": oid, "admin_id": admin_id})
        if not user:
            raise HTTPException(status_code=404, detail="Collaborator not found")
            
        await users_collection.delete_one({"_id": oid, "admin_id": admin_id})

    @staticmethod
    async def get_users_by_admin(admin_id: str) -> list[User]:
        cursor = users_collection.find({"admin_id": admin_id, "role": "collaborator"})
        users = []
        async for doc in cursor:
            users.append(User(**doc))
        return users

    @staticmethod
    async def create_merchant(merchant_data: UserCreate) -> User:
        # Check if email or phone already exists
        existing = await users_collection.find_one({
            "$or": [
                {"email": merchant_data.email},
                {"phone": merchant_data.phone}
            ]
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email or phone already registered")
        
        # Auto-generate a temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        hashed_password = hash_password(temp_password)
        
        # Merchants are admins of their own shop
        user = User(
            role="admin",
            name=merchant_data.name,
            email=merchant_data.email,
            phone=merchant_data.phone,
            password_hash=hashed_password,
            must_change_password=True,
            is_active=True
        )
        result = await users_collection.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id
        return user

    @staticmethod
    async def get_all_merchants() -> list[User]:
        cursor = users_collection.find({"role": "admin"})
        merchants = []
        async for doc in cursor:
            merchants.append(User(**doc))
        return merchants

    @staticmethod
    async def toggle_user_active_status(user_id: str):
        try:
            oid = ObjectId(user_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        user = await users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_status = not user.get("is_active", True)
        await users_collection.update_one({"_id": oid}, {"$set": {"is_active": new_status}})
        return new_status

    @staticmethod
    async def reset_user_password(user_id: str):
        try:
            oid = ObjectId(user_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        # We don't need to change the password string itself, just force them to change it
        # or we can set it to a master key temporarily and force change.
        # Given the Master Key exists, we just mark it as must_change.
        await users_collection.update_one(
            {"_id": oid},
            {"$set": {"must_change_password": True}}
        )
        return True

