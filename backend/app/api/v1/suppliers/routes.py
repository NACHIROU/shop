from fastapi import APIRouter, Depends
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services.supplier_service import SupplierService
from app.core.dependencies import get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=SupplierResponse)
async def create_supplier(
    supplier_data: SupplierCreate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    supplier = await SupplierService.create_supplier(admin_id, supplier_data)
    return SupplierResponse(
        id=str(supplier.id),
        name=supplier.name,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
        notes=supplier.notes,
        created_at=supplier.created_at.isoformat()
    )

@router.get("/", response_model=list[SupplierResponse])
async def get_suppliers(current_user: User = Depends(get_current_admin_or_collaborator)):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await SupplierService.get_suppliers(admin_id)

@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await SupplierService.get_supplier_by_id(supplier_id, admin_id)

@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: str,
    supplier_data: SupplierUpdate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await SupplierService.update_supplier(supplier_id, admin_id, supplier_data)

@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    await SupplierService.delete_supplier(supplier_id, admin_id)
    return {"message": "Supplier deleted successfully"}
