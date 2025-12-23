from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User
from app.models.category import Category, CategoryCreate, CategoryResponse
from app.db.mongo import categories_collection
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    cursor = categories_collection.find({"admin_id": admin_id}).sort("name", 1)
    categories = await cursor.to_list(length=100)
    return [Category(**doc) for doc in categories]

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    
    # Check if exists
    existing = await categories_collection.find_one({"admin_id": admin_id, "name": category_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_category = Category(
        admin_id=admin_id,
        name=category_data.name,
        created_at=datetime.utcnow()
    )
    
    result = await categories_collection.insert_one(new_category.model_dump(by_alias=True))
    created_category = await categories_collection.find_one({"_id": result.inserted_id})
    return Category(**created_category)

@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    from bson import ObjectId
    
    # Verify ownership
    result = await categories_collection.delete_one({"_id": ObjectId(category_id), "admin_id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return {"message": "Category deleted"}
