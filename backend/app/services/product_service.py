from app.db.mongo import products_collection, suppliers_collection, operations_collection
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, PaginatedProductResponse
from typing import List, Optional
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId

class ProductService:
    @staticmethod
    async def create_product(admin_id: str, product_data: ProductCreate, actor_id: str, actor_name: str) -> Product:
        from app.services.audit_log_service import AuditLogService
        # Validate IMEI uniqueness per admin (only if IMEI is provided)
        if product_data.imei:
            existing = await products_collection.find_one({
                "admin_id": admin_id,
                "imei": product_data.imei
            })
            if existing:
                raise HTTPException(status_code=400, detail="Un produit avec cet IMEI existe déjà")
        
        product = Product(
            admin_id=admin_id,
            name=product_data.name,
            description=product_data.description,
            imei=product_data.imei,
            purchase_price=product_data.purchase_price,
            category=product_data.category,
            stock=0, # Base stock is 0, we record the initial stock as a purchase operation
            supplier_id=product_data.supplier_id
        )
        result = await products_collection.insert_one(product.dict(by_alias=True))
        product.id = result.inserted_id

        # Record as a purchase operation for treasury reports
        from app.models.operation import Operation
        from app.db.mongo import operations_collection
        
        operation = Operation(
            admin_id=admin_id,
            collaborator_id=admin_id, # Created by admin
            type="purchase",
            product_id=str(product.id),
            supplier_id=product.supplier_id,
            quantity=product_data.stock or 1,
            amount=product.purchase_price * (product_data.stock or 1),
            operation_date=datetime.utcnow(),
            note=f"Achat initial à la création du produit: {product.name}"
        )
        await operations_collection.insert_one(operation.dict(by_alias=True))

        await AuditLogService.log_action(
            admin_id=admin_id,
            user_id=actor_id,
            user_name=actor_name,
            action="create_product",
            resource_type="product",
            resource_id=str(product.id),
            details=f"Création du produit: {product.name}"
        )

        return product

    @staticmethod
    async def get_products(
        admin_id: Optional[str] = None, 
        page: int = 1, 
        size: int = 50,
        search: Optional[str] = None,
        category: Optional[str] = None,
        is_archived: bool = False,
        restricted: bool = False,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sold_by: Optional[str] = None
    ) -> dict:
        import math
        skip = (page - 1) * size
        if not admin_id:
            raise HTTPException(status_code=403, detail="Admin ID required for isolation")
        query = {"admin_id": admin_id}
        query["is_archived"] = is_archived
        
        # Add search filter
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"imei": {"$regex": search, "$options": "i"}}
            ]
        
        # Add category filter
        if category and category != "all":
            query["category"] = category
            
        # Add collaborator filter
        if sold_by:
            query["sold_by"] = sold_by
            
        # Add date filter
        if start_date and end_date:
            try:
                # Parse dates - assuming ISO format YYYY-MM-DD
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                
                date_field = "sold_at" if is_archived else "created_at"
                query[date_field] = {"$gte": start, "$lte": end}
            except ValueError:
                # If date parsing fails, ignore or handle error
                pass
        
        total = await products_collection.count_documents(query)
        
        # Calculate total value (purchase_price * stock) and total sales (selling_price)
        # Skip for restricted views to avoid leaking total inventory value
        total_value = 0
        total_sales = 0
        total_profit = 0
        if not restricted:
            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": None, 
                    "total_value": {"$sum": {"$multiply": ["$purchase_price", "$stock"]}},
                    "total_sales": {"$sum": "$selling_price"},
                    "total_profit": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$is_archived", True]},
                                {"$subtract": [
                                    {"$ifNull": ["$selling_price", 0]}, 
                                    {"$ifNull": ["$purchase_price", 0]}
                                ]},
                                0
                            ]
                        }
                    }
                }}
            ]
            stats = await products_collection.aggregate(pipeline).to_list(length=1)
            if stats:
                total_value = stats[0].get("total_value", 0)
                total_sales = stats[0].get("total_sales", 0)
                total_profit = stats[0].get("total_profit", 0)

        cursor = products_collection.find(query).skip(skip).limit(size).sort("created_at", -1)
        
        products = []
        async for doc in cursor:
            product = Product(**doc)
            # Calculate stock from operations
            stock = await ProductService._calculate_stock(str(product.id), admin_id, product.stock)
            
            data = {
                "id": str(product.id),
                "name": product.name,
                "description": product.description,
                "imei": product.imei,
                "stock": stock,
                "category": product.category,
                "is_archived": product.is_archived,
                "selling_price": product.selling_price,
                "client_name": product.client_name,
                "sold_by": product.sold_by,
                "sold_at": product.sold_at.isoformat() if product.sold_at else None,
                "created_at": product.created_at.isoformat()
            }

            if not restricted:
                # Get supplier name
                supplier_name = None
                if product.supplier_id:
                    supplier = await suppliers_collection.find_one({"_id": ObjectId(product.supplier_id) if ObjectId.is_valid(product.supplier_id) else product.supplier_id, "admin_id": admin_id})
                    if supplier:
                        supplier_name = supplier["name"]
                
                data.update({
                    "purchase_price": product.purchase_price,
                    "supplier_id": product.supplier_id,
                    "supplier_name": supplier_name
                })
            
            products.append(data)
            
        return {
            "items": products,
            "total": total,
            "page": page,
            "size": size,
            "pages": math.ceil(total / size) if size > 0 else 1,
            "total_value": total_value,
            "total_sales": total_sales,
            "total_profit": total_profit
        }

    @staticmethod
    async def get_product_by_id(product_id: str, admin_id: str, restricted: bool = False) -> dict:
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid product ID")

        doc = await products_collection.find_one({"_id": oid, "admin_id": admin_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Product not found")
        product = Product(**doc)
        
        stock = await ProductService._calculate_stock(product_id, admin_id, product.stock)
        
        data = {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "imei": product.imei,
            "stock": stock,
            "category": product.category,
            "is_archived": product.is_archived,
            "selling_price": product.selling_price,
            "client_name": product.client_name,
            "sold_by": product.sold_by,
            "sold_at": product.sold_at.isoformat() if product.sold_at else None,
            "created_at": product.created_at.isoformat()
        }

        if not restricted:
            supplier_name = None
            if product.supplier_id:
                supplier = await suppliers_collection.find_one({"_id": ObjectId(product.supplier_id) if ObjectId.is_valid(product.supplier_id) else product.supplier_id, "admin_id": admin_id})
                if supplier:
                    supplier_name = supplier["name"]
            
            data.update({
                "purchase_price": product.purchase_price,
                "supplier_id": product.supplier_id,
                "supplier_name": supplier_name
            })
            
        return data

    @staticmethod
    async def update_product(product_id: str, admin_id: str, update_data: ProductUpdate, actor_id: str, actor_name: str) -> ProductResponse:
        from app.services.audit_log_service import AuditLogService
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail=f"Invalid product ID: {product_id}")

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if "imei" in update_dict and update_dict["imei"]:
            existing = await products_collection.find_one({
                "admin_id": admin_id,
                "imei": update_dict["imei"],
                "_id": {"$ne": oid}
            })
            if existing:
                raise HTTPException(status_code=400, detail=f"Un produit avec cet IMEI ({update_dict['imei']}) existe déjà")

        if update_dict:
            # If stock is being updated, we need to adjust base_stock such that:
            # base_stock + purchases - sales = target_stock
            if "stock" in update_dict:
                target_stock = update_dict.pop("stock")
                purchases = await operations_collection.count_documents({"product_id": product_id, "type": "purchase", "admin_id": admin_id})
                sales = await operations_collection.count_documents({"product_id": product_id, "type": "sale", "admin_id": admin_id})
                update_dict["stock"] = target_stock - (purchases - sales)

            update_dict["updated_at"] = datetime.utcnow()
            result = await products_collection.update_one(
                {"_id": oid, "admin_id": admin_id},
                {"$set": update_dict}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found or not owned by admin {admin_id}")
            
            await AuditLogService.log_action(
                admin_id=admin_id,
                user_id=actor_id,
                user_name=actor_name,
                action="update_product",
                resource_type="product",
                resource_id=product_id,
                details=f"Mise à jour du produit",
                changes=update_dict
            )
        
        return await ProductService.get_product_by_id(product_id, admin_id)

    @staticmethod
    async def delete_product(product_id: str, admin_id: str, actor_id: str, actor_name: str):
        from app.services.audit_log_service import AuditLogService
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid product ID")
            
        result = await products_collection.delete_one({"_id": oid, "admin_id": admin_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
            
        await AuditLogService.log_action(
            admin_id=admin_id,
            user_id=actor_id,
            user_name=actor_name,
            action="delete_product",
            resource_type="product",
            resource_id=product_id,
            details=f"Suppression du produit"
        )

    @staticmethod
    async def _calculate_stock(product_id: str, admin_id: str, base_stock: int = 0) -> int:
        # Purchases increase stock, sales decrease
        # We start with base_stock (initial stock set on product)
        # Isolation: Mandatory admin_id
        purchases = await operations_collection.count_documents(
            {"product_id": product_id, "type": "purchase", "admin_id": admin_id}
        )
        sales = await operations_collection.count_documents(
            {"product_id": product_id, "type": "sale", "admin_id": admin_id}
        )
        return base_stock + purchases - sales

    @staticmethod
    async def bulk_action(admin_id: str, action: str, product_ids: list[str], actor_id: str, actor_name: str):
        from app.services.audit_log_service import AuditLogService
        
        count = 0
        if action == "delete":
            for pid in product_ids:
                try:
                    await ProductService.delete_product(pid, admin_id, actor_id, actor_name)
                    count += 1
                except:
                    pass
        elif action == "archive":
            object_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
            if object_ids:
                result = await products_collection.update_many(
                    {"_id": {"$in": object_ids}, "admin_id": admin_id},
                    {"$set": {"is_archived": True}}
                )
                count = result.modified_count
        
        await AuditLogService.log_action(
            admin_id=admin_id,
            user_id=actor_id,
            user_name=actor_name,
            action="bulk_product_action",
            resource_type="product",
            resource_id="bulk",
            details=f"Action groupée ({action}) sur {count} produits"
        )
        return {"message": f"Action {action} performed on {count} products"}
