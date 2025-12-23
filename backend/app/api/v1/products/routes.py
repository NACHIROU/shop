from fastapi import APIRouter, Depends, Query, Body
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, PaginatedProductResponse, RestrictedProductResponse, PaginatedRestrictedProductResponse
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
    product = await ProductService.create_product(admin_id, product_data, str(current_user.id), current_user.name)
    return await ProductService.get_product_by_id(str(product.id), admin_id)

@router.get("/", response_model=PaginatedProductResponse | PaginatedRestrictedProductResponse)
async def get_products(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    category: str = Query(None),
    is_archived: bool = Query(False),
    start_date: str = Query(None),
    end_date: str = Query(None),
    sold_by: str = Query(None),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    is_collaborator = current_user.role == "collaborator"
    return await ProductService.get_products(
        admin_id, page, size, search, category, is_archived, restricted=is_collaborator,
        start_date=start_date, end_date=end_date, sold_by=sold_by
    )

@router.get("/export")
async def export_products(
    search: str = Query(None),
    category: str = Query(None),
    is_archived: bool = Query(False),
    start_date: str = Query(None),
    end_date: str = Query(None),
    sold_by: str = Query(None),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    from fastapi.responses import StreamingResponse
    import io
    import csv

    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    is_collaborator = current_user.role == "collaborator"
    
    # Get all products (high limit)
    result = await ProductService.get_products(
        admin_id, 1, 10000, search, category, is_archived, restricted=is_collaborator,
        start_date=start_date, end_date=end_date, sold_by=sold_by
    )
    products = result["items"]

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    headers = ["Nom", "IMEI", "Catégorie", "Stock", "Prix Achat", "Prix Vente", "Vendeur", "Date Vente", "Client"]
    writer.writerow(headers)
    
    for p in products:
        row = [
            p.get("name", ""),
            p.get("imei", ""),
            p.get("category", ""),
            p.get("stock", 0),
            p.get("purchase_price", 0) if not is_collaborator else "N/A",
            p.get("selling_price", 0) or 0,
            p.get("sold_by", "") or "",
            p.get("sold_at", "") or "",
            p.get("client_name", "") or ""
        ]
        writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_export.csv"}
    )

@router.get("/{product_id}", response_model=ProductResponse | RestrictedProductResponse)
async def get_product(
    product_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    is_collaborator = current_user.role == "collaborator"
    return await ProductService.get_product_by_id(product_id, admin_id, restricted=is_collaborator)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await ProductService.update_product(product_id, admin_id, product_data, str(current_user.id), current_user.name)

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    await ProductService.delete_product(product_id, admin_id, str(current_user.id), current_user.name)
    return {"message": "Product deleted successfully"}

@router.post("/bulk")
async def bulk_product_action(
    action: str = Body(..., embed=True),
    product_ids: list[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    from fastapi import Body
    return await ProductService.bulk_action(admin_id, action, product_ids, str(current_user.id), current_user.name)
