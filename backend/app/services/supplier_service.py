from app.db.mongo import suppliers_collection
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from typing import List, Optional
from fastapi import HTTPException

class SupplierService:
    @staticmethod
    async def create_supplier(admin_id: str, supplier_data: SupplierCreate) -> Supplier:
        supplier = Supplier(
            admin_id=admin_id,
            name=supplier_data.name,
            phone=supplier_data.phone,
            email=supplier_data.email,
            address=supplier_data.address,
            notes=supplier_data.notes
        )
        result = await suppliers_collection.insert_one(supplier.dict(by_alias=True))
        supplier.id = result.inserted_id
        return supplier

    @staticmethod
    async def get_suppliers(admin_id: Optional[str] = None) -> List[SupplierResponse]:
        cursor = suppliers_collection.find({"admin_id": admin_id} if admin_id else {})
        suppliers = []
        async for doc in cursor:
            supplier = Supplier(**doc)
            suppliers.append(SupplierResponse(
                id=str(supplier.id),
                name=supplier.name,
                phone=supplier.phone,
                email=supplier.email,
                address=supplier.address,
                notes=supplier.notes,
                created_at=supplier.created_at.isoformat()
            ))
        return suppliers

    @staticmethod
    async def get_supplier_by_id(supplier_id: str, admin_id: str) -> SupplierResponse:
        doc = await suppliers_collection.find_one({"_id": supplier_id, "admin_id": admin_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Supplier not found")
        supplier = Supplier(**doc)
        return SupplierResponse(
            id=str(supplier.id),
            name=supplier.name,
            phone=supplier.phone,
            email=supplier.email,
            address=supplier.address,
            notes=supplier.notes,
            created_at=supplier.created_at.isoformat()
        )

    @staticmethod
    async def update_supplier(supplier_id: str, admin_id: str, update_data: SupplierUpdate) -> SupplierResponse:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if update_dict:
            await suppliers_collection.update_one(
                {"_id": supplier_id, "admin_id": admin_id},
                {"$set": update_dict}
            )
        return await SupplierService.get_supplier_by_id(supplier_id, admin_id)

    @staticmethod
    async def delete_supplier(supplier_id: str, admin_id: str):
        result = await suppliers_collection.delete_one({"_id": supplier_id, "admin_id": admin_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Supplier not found")
