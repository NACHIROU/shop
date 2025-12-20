from fastapi import APIRouter, Depends, Query
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, PaginatedProductResponse
from app.services.product_service import ProductService
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    product = await ProductService.create_product(admin_id, product_data)
    return await ProductService.get_product_by_id(str(product.id), admin_id)

@router.get("/", response_model=PaginatedProductResponse)
async def get_products(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    category: str = Query(None),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ProductService.get_products(admin_id, page, size, search, category)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ProductService.get_product_by_id(product_id, admin_id)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ProductService.update_product(product_id, admin_id, product_data)

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    await ProductService.delete_product(product_id, admin_id)
    return {"message": "Product deleted successfully"}
