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
            stock=product_data.stock,
            supplier_id=product_data.supplier_id
        )
        result = await products_collection.insert_one(product.dict(by_alias=True))
        product.id = result.inserted_id
        return product

    @staticmethod
    async def get_products(
        admin_id: Optional[str] = None, 
        page: int = 1, 
        size: int = 50,
        search: Optional[str] = None,
        category: Optional[str] = None
    ) -> PaginatedProductResponse:
        import math
        skip = (page - 1) * size
        query = {"admin_id": admin_id} if admin_id else {}
        
        # Add search filter
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"imei": {"$regex": search, "$options": "i"}}
            ]
        
        # Add category filter
        if category and category != "all":
            query["category"] = category
        
        total = await products_collection.count_documents(query)
        
        # Calculate total value (purchase price * stock)
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None, 
                "total_value": {"$sum": {"$multiply": ["$purchase_price", "$stock"]}}
            }}
        ]
        stats = await products_collection.aggregate(pipeline).to_list(length=1)
        total_value = stats[0]["total_value"] if stats else 0

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
                description=product.description,
                imei=product.imei,
                purchase_price=product.purchase_price,
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
            total_value=total_value
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
            description=product.description,
            imei=product.imei,
            purchase_price=product.purchase_price,
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
            update_dict["updated_at"] = datetime.utcnow()
            result = await products_collection.update_one(
                {"_id": oid, "admin_id": admin_id},
                {"$set": update_dict}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found or not owned by admin {admin_id}")
        
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
