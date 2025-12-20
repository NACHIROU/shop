from app.db.mongo import products_collection, suppliers_collection, operations_collection
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, PaginatedProductResponse
from typing import List, Optional
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId

class ProductService:
    @staticmethod
    async def create_product(admin_id: str, product_data: ProductCreate) -> Product:
        product = Product(
            admin_id=admin_id,
            name=product_data.name,
            purchase_price=product_data.purchase_price,
            selling_price=product_data.selling_price,
            category=product_data.category,
            stock=product_data.stock,
            supplier_id=product_data.supplier_id
        )
        result = await products_collection.insert_one(product.dict(by_alias=True))
        product.id = result.inserted_id
        return product

    @staticmethod
    async def get_products(admin_id: Optional[str] = None, page: int = 1, size: int = 50) -> PaginatedProductResponse:
        import math
        skip = (page - 1) * size
        query = {"admin_id": admin_id} if admin_id else {}
        
        total = await products_collection.count_documents(query)
        
        # Calculate stats for all products (matching query)
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None, 
                "total_value": {"$sum": {"$multiply": ["$selling_price", "$stock"]}},
                "total_profit": {"$sum": {"$multiply": [{"$subtract": ["$selling_price", "$purchase_price"]}, "$stock"]}}
            }}
        ]
        stats = await products_collection.aggregate(pipeline).to_list(length=1)
        total_value = stats[0]["total_value"] if stats else 0
        total_profit = stats[0]["total_profit"] if stats else 0

        cursor = products_collection.find(query).skip(skip).limit(size)
        
        products = []
        async for doc in cursor:
            product = Product(**doc)
            # Get supplier name
            supplier_name = None
            if product.supplier_id:
                supplier = await suppliers_collection.find_one({"_id": ObjectId(product.supplier_id) if ObjectId.is_valid(product.supplier_id) else product.supplier_id, "admin_id": admin_id})
                if supplier:
                    supplier_name = supplier["name"]
            
            # Calculate stock from operations
            stock = await ProductService._calculate_stock(str(product.id), admin_id, product.stock)
            
            products.append(ProductResponse(
                id=str(product.id),
                name=product.name,
                purchase_price=product.purchase_price,
                selling_price=product.selling_price,
                stock=stock,
                category=product.category,
                supplier_id=product.supplier_id,
                supplier_name=supplier_name,
                created_at=product.created_at.isoformat()
            ))
            
        return PaginatedProductResponse(
            items=products,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size),
            total_value=total_value,
            total_profit=total_profit
        )

    @staticmethod
    async def get_product_by_id(product_id: str, admin_id: str) -> ProductResponse:
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid product ID")

        doc = await products_collection.find_one({"_id": oid, "admin_id": admin_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Product not found")
        product = Product(**doc)
        supplier_name = None
        if product.supplier_id:
            supplier = await suppliers_collection.find_one({"_id": ObjectId(product.supplier_id) if ObjectId.is_valid(product.supplier_id) else product.supplier_id, "admin_id": admin_id})
            if supplier:
                supplier_name = supplier["name"]
        stock = await ProductService._calculate_stock(product_id, admin_id, product.stock)
        return ProductResponse(
            id=str(product.id),
            name=product.name,
            purchase_price=product.purchase_price,
            selling_price=product.selling_price,
            stock=stock,
            category=product.category,
            supplier_id=product.supplier_id,
            supplier_name=supplier_name,
            created_at=product.created_at.isoformat()
        )

    @staticmethod
    async def update_product(product_id: str, admin_id: str, update_data: ProductUpdate) -> ProductResponse:
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid product ID")

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            await products_collection.update_one(
                {"_id": oid, "admin_id": admin_id},
                {"$set": update_dict}
            )
        return await ProductService.get_product_by_id(product_id, admin_id)

    @staticmethod
    async def delete_product(product_id: str, admin_id: str):
        try:
            oid = ObjectId(product_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid product ID")
            
        result = await products_collection.delete_one({"_id": oid, "admin_id": admin_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")

    @staticmethod
    async def _calculate_stock(product_id: str, admin_id: Optional[str] = None, base_stock: int = 0) -> int:
        # Purchases increase stock, sales decrease
        # We start with base_stock (initial stock set on product)
        purchases = await operations_collection.count_documents(
            {"product_id": product_id, "type": "purchase"} | ({"admin_id": admin_id} if admin_id else {})
        )
        sales = await operations_collection.count_documents(
            {"product_id": product_id, "type": "sale"} | ({"admin_id": admin_id} if admin_id else {})
        )
        return base_stock + purchases - sales
