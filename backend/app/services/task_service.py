from app.db.mongo import tasks_collection, users_collection, products_collection, operations_collection
from app.services.notification_service import NotificationService
from app.models.task import Task
from app.models.product import Product
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from typing import List
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId

class TaskService:
    @staticmethod
    async def create_task(admin_id: str, task_data: TaskCreate) -> Task:
        # Set default date if not provided
        task_date = task_data.date if task_data.date else datetime.utcnow()
        
        # Handle "vente" (sale) type
        if task_data.type == "vente":
            if not task_data.product_id or not task_data.selling_price:
                raise HTTPException(
                    status_code=400, 
                    detail="Pour une vente, le produit et le prix de vente sont obligatoires"
                )
            # Validate product exists and has stock
            product_doc = await products_collection.find_one({
                "_id": ObjectId(task_data.product_id) if ObjectId.is_valid(task_data.product_id) else task_data.product_id,
                "admin_id": admin_id
            })
            if not product_doc:
                raise HTTPException(status_code=404, detail="Produit non trouvé")
            
            # Use ProductService to calculate current stock including operations
            from app.services.product_service import ProductService
            current_stock = await ProductService._calculate_stock(str(product_doc["_id"]), admin_id, product_doc.get("stock", 0))
            if current_stock <= 0:
                raise HTTPException(status_code=400, detail="Stock insuffisant pour ce produit")
        
        # Handle "troc" (trade) type
        incoming_product_id = None
        if task_data.type == "troc":
            # Validate all required fields for trade
            if not all([
                task_data.outgoing_product_id,
                task_data.outgoing_product_price,
                task_data.incoming_product_name,
                task_data.incoming_product_imei,
                task_data.incoming_product_price,
                task_data.recovered_from
            ]):
                raise HTTPException(
                    status_code=400,
                    detail="Pour un troc, tous les champs (produit sortant, produit entrant, prix, IMEI, récupéré de) sont obligatoires"
                )
            
            # Validate outgoing product exists and has stock
            outgoing_product_doc = await products_collection.find_one({
                "_id": ObjectId(task_data.outgoing_product_id) if ObjectId.is_valid(task_data.outgoing_product_id) else task_data.outgoing_product_id,
                "admin_id": admin_id
            })
            if not outgoing_product_doc:
                raise HTTPException(status_code=404, detail="Produit sortant non trouvé")
            
            from app.services.product_service import ProductService
            current_stock = await ProductService._calculate_stock(str(outgoing_product_doc["_id"]), admin_id, outgoing_product_doc.get("stock", 0))
            if current_stock <= 0:
                raise HTTPException(status_code=400, detail="Stock insuffisant pour le produit sortant")
            
            # Check IMEI uniqueness for incoming product
            existing_imei = await products_collection.find_one({
                "admin_id": admin_id,
                "imei": task_data.incoming_product_imei
            })
            if existing_imei:
                raise HTTPException(status_code=400, detail="Un produit avec cet IMEI existe déjà")
            
            # Create incoming product
            incoming_product = Product(
                admin_id=admin_id,
                name=task_data.incoming_product_name,
                imei=task_data.incoming_product_imei,
                purchase_price=task_data.incoming_product_price,
                category=task_data.incoming_product_category or "Autres",
                stock=1,  # Initial stock for incoming product
                supplier_id=None
            )
            result = await products_collection.insert_one(incoming_product.dict(by_alias=True))
            incoming_product_id = str(result.inserted_id)
        
        # Create task
        task = Task(
            admin_id=admin_id,
            collaborator_id=task_data.assigned_to,
            type=task_data.type,
            title=task_data.title,
            description=task_data.description,
            product_id=task_data.product_id,
            quantity=task_data.quantity,
            client_name=task_data.client_name,
            client_phone=task_data.client_phone,
            status="in_progress",
            date=task_date,
            selling_price=task_data.selling_price,
            client=task_data.client,
            outgoing_product_id=task_data.outgoing_product_id,
            outgoing_product_price=task_data.outgoing_product_price,
            incoming_product_name=task_data.incoming_product_name,
            incoming_product_imei=task_data.incoming_product_imei,
            incoming_product_price=task_data.incoming_product_price,
            incoming_product_category=task_data.incoming_product_category,
            recovered_from=task_data.recovered_from
        )
        result = await tasks_collection.insert_one(task.dict(by_alias=True))
        task.id = result.inserted_id
        
        # Send notification to assigned collaborator
        if task.collaborator_id:
            await NotificationService.create_notification(
                user_id=task.collaborator_id,
                title="Nouvelle tâche",
                message=f"Une nouvelle tâche '{task.title}' vous a été assignée.",
                type="new_task"
            )
            
        return task

    @staticmethod
    async def get_tasks(admin_id: str, collaborator_id: str = None) -> List[TaskResponse]:
        query = {"admin_id": admin_id}
        if collaborator_id:
            query["collaborator_id"] = collaborator_id
        
        cursor = tasks_collection.find(query).sort("created_at", -1)
        tasks = []
        async for doc in cursor:
            task = Task(**doc)
            # Get assigned user name
            user = await users_collection.find_one({"_id": ObjectId(task.collaborator_id) if ObjectId.is_valid(task.collaborator_id) else task.collaborator_id})
            assigned_name = user["name"] if user else "Unknown"
            
            # Get product name
            product_name = None
            if task.product_id:
                product = await products_collection.find_one({
                    "_id": ObjectId(task.product_id) if ObjectId.is_valid(task.product_id) else task.product_id,
                    "admin_id": admin_id
                })
                if product:
                    product_name = product["name"]
            
            tasks.append(TaskResponse(
                id=str(task.id),
                title=task.title,
                description=task.description,
                type=task.type,
                status=task.status,
                assigned_to=task.collaborator_id,
                assigned_to_name=assigned_name,
                product_id=task.product_id,
                product_name=product_name,
                quantity=task.quantity,
                client_name=task.client_name,
                client_phone=task.client_phone,
                date=task.date.isoformat(),
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat(),
                selling_price=task.selling_price,
                client=task.client,
                outgoing_product_id=task.outgoing_product_id,
                outgoing_product_price=task.outgoing_product_price,
                incoming_product_name=task.incoming_product_name,
                incoming_product_imei=task.incoming_product_imei,
                incoming_product_price=task.incoming_product_price,
                incoming_product_category=task.incoming_product_category,
                recovered_from=task.recovered_from
            ))
        return tasks

    @staticmethod
    async def get_task_by_id(task_id: str, admin_id: str) -> TaskResponse:
        doc = await tasks_collection.find_one({
            "_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id,
            "admin_id": admin_id
        })
        if not doc:
            raise HTTPException(status_code=404, detail="Task not found")
        task = Task(**doc)
        user = await users_collection.find_one({"_id": ObjectId(task.collaborator_id) if ObjectId.is_valid(task.collaborator_id) else task.collaborator_id})
        assigned_name = user["name"] if user else "Unknown"
        product_name = None
        if task.product_id:
            product = await products_collection.find_one({
                "_id": ObjectId(task.product_id) if ObjectId.is_valid(task.product_id) else task.product_id,
                "admin_id": admin_id
            })
            if product:
                product_name = product["name"]
        return TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            type=task.type,
            status=task.status,
            assigned_to=task.collaborator_id,
            assigned_to_name=assigned_name,
            product_id=task.product_id,
            product_name=product_name,
            quantity=task.quantity,
            client_name=task.client_name,
            client_phone=task.client_phone,
            date=task.date.isoformat(),
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat(),
            selling_price=task.selling_price,
            client=task.client,
            outgoing_product_id=task.outgoing_product_id,
            outgoing_product_price=task.outgoing_product_price,
            incoming_product_name=task.incoming_product_name,
            incoming_product_imei=task.incoming_product_imei,
            incoming_product_price=task.incoming_product_price,
            incoming_product_category=task.incoming_product_category,
            recovered_from=task.recovered_from
        )

    @staticmethod
    async def update_task(task_id: str, admin_id: str, update_data: TaskUpdate) -> TaskResponse:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if "assigned_to" in update_dict:
            update_dict["collaborator_id"] = update_dict.pop("assigned_to")
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            await tasks_collection.update_one(
                {"_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id, "admin_id": admin_id},
                {"$set": update_dict}
            )
        
        # If status is updated away from completed, rollback
        old_status = (await TaskService.get_task_by_id(task_id, admin_id)).status
        if old_status == "completed" and update_dict.get("status") != "completed" and update_dict.get("status") is not None:
             await TaskService._rollback_completed_task_operations(task_id, admin_id)

        # If status is updated to completed, handle operations
        if update_dict.get("status") == "completed" and old_status != "completed":
            await TaskService._record_completed_task_operations(task_id, admin_id)
            
        return await TaskService.get_task_by_id(task_id, admin_id)

    @staticmethod
    async def update_task_status(task_id: str, admin_id: str, status: str) -> TaskResponse:
        task_before = await TaskService.get_task_by_id(task_id, admin_id)
        old_status = task_before.status

        await tasks_collection.update_one(
            {"_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id, "admin_id": admin_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        # Handle operations when status is completed
        if status == "completed" and old_status != "completed":
            await TaskService._record_completed_task_operations(task_id, admin_id)
        # Handle rollback if status was completed and moved to something else
        elif old_status == "completed" and status != "completed":
            await TaskService._rollback_completed_task_operations(task_id, admin_id)
        
        # New: Robust cleanup for cancelled status
        if status == "cancelled":
            await TaskService._cleanup_task_resources(task_id, admin_id)
            
        return await TaskService.get_task_by_id(task_id, admin_id)

    @staticmethod
    async def _cleanup_task_resources(task_id: str, admin_id: str):
        """Perform full cleanup for a task (on cancellation or deletion)"""
        task_doc = await tasks_collection.find_one({
            "_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id,
            "admin_id": admin_id
        })
        if not task_doc:
            return

        task = Task(**task_doc)

        # 1. Rollback operations if it was completed
        # This is safe to call even if not completed, it checks for existing operations by note
        await TaskService._rollback_completed_task_operations(task_id, admin_id)

        # 2. Specific cleanup for "troc" (delete incoming product if it exists and wasn't sold)
        if task.type == "troc" and task.incoming_product_imei:
            incoming_product = await products_collection.find_one({
                "admin_id": admin_id,
                "imei": task.incoming_product_imei,
                "name": task.incoming_product_name
            })
            if incoming_product:
                # Only delete if it hasn't been sold yet (is_archived would be true if sold)
                if not incoming_product.get("is_archived", False):
                    await products_collection.delete_one({"_id": incoming_product["_id"]})

    @staticmethod
    async def _record_completed_task_operations(task_id: str, admin_id: str):
        task_doc = await tasks_collection.find_one({"_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id})
        if not task_doc:
            return

        task = Task(**task_doc)
        
        # Avoid duplicate operations if already recorded
        existing_op = await operations_collection.find_one({"note": f"Task completion: {task_id}"})
        if existing_op:
            return

        from app.models.operation import Operation
        
        if task.type == "vente" and task.product_id:
            # For a normal sale, profit can be calculated if we know the purchase price
            # But the user specifically asked to value operational profits from sales and trocs
            product = await products_collection.find_one({"_id": ObjectId(task.product_id) if ObjectId.is_valid(task.product_id) else task.product_id})
            purchase_price = product.get("purchase_price", 0) if product else 0
            sale_profit = (task.selling_price or 0) - purchase_price
            
            # 1. Update the operation
            op = Operation(
                admin_id=admin_id,
                collaborator_id=task.collaborator_id,
                type="sale",
                product_id=task.product_id,
                quantity=task.quantity or 1,
                amount=task.selling_price or 0,
                profit=sale_profit,
                operation_date=datetime.utcnow(),
                note=f"Task completion: {task_id}"
            )
            await operations_collection.insert_one(op.dict(by_alias=True))
            
            # Get collaborator name for archiving
            collaborator = await users_collection.find_one({"_id": ObjectId(task.collaborator_id) if ObjectId.is_valid(task.collaborator_id) else task.collaborator_id})
            collaborator_name = collaborator["name"] if collaborator else "Unknown"

            # 2. Archive the product
            await products_collection.update_one(
                {"_id": ObjectId(task.product_id) if ObjectId.is_valid(task.product_id) else task.product_id},
                {"$set": {
                    "is_archived": True,
                    "selling_price": task.selling_price,
                    "client_name": task.client_name or task.client,
                    "sold_by": collaborator_name,
                    "sold_at": datetime.utcnow(),
                    "stock": 0 # Once sold, stock should be 0 (or reduced if we support multiple, but here it's IMEI based)
                }}
            )
            
        elif task.type == "troc" and task.outgoing_product_id:
            # Operation for outgoing product (sale)
            # Profit logic: Price(Outgoing) - Price(Incoming) = Cash received
            troc_profit = (task.outgoing_product_price or 0) - (task.incoming_product_price or 0)
            
            # 1. Record the "sale" of the outgoing product
            op_out = Operation(
                admin_id=admin_id,
                collaborator_id=task.collaborator_id,
                type="sale",
                product_id=task.outgoing_product_id,
                quantity=1,
                amount=task.outgoing_product_price or 0,
                profit=troc_profit, # The profit is attributed to the trade operation
                operation_date=datetime.utcnow(),
                note=f"Task completion (trade-out): {task_id}"
            )
            await operations_collection.insert_one(op_out.dict(by_alias=True))
            
            # Archive the outgoing product
            collaborator = await users_collection.find_one({"_id": ObjectId(task.collaborator_id) if ObjectId.is_valid(task.collaborator_id) else task.collaborator_id})
            collaborator_name = collaborator["name"] if collaborator else "Unknown"

            await products_collection.update_one(
                {"_id": ObjectId(task.outgoing_product_id) if ObjectId.is_valid(task.outgoing_product_id) else task.outgoing_product_id},
                {"$set": {
                    "is_archived": True,
                    "selling_price": task.outgoing_product_price,
                    "client_name": task.recovered_from, # In a trade, the person we get the model from is the 'client' of the outgoing one
                    "sold_by": collaborator_name,
                    "sold_at": datetime.utcnow(),
                    "stock": 0
                }}
            )
            
            # 2. Record the "purchase" of the incoming product to reflect financial flow
            # We need to find the ID of the product we created during task creation
            incoming_product = await products_collection.find_one({
                "admin_id": admin_id,
                "imei": task.incoming_product_imei,
                "name": task.incoming_product_name
            })
            
            if incoming_product:
                op_in = Operation(
                    admin_id=admin_id,
                    collaborator_id=task.collaborator_id,
                    type="purchase",
                    product_id=str(incoming_product["_id"]),
                    quantity=1,
                    amount=task.incoming_product_price or 0,
                    operation_date=datetime.utcnow(),
                    note=f"Task completion (trade-in): {task_id}"
                )
                await operations_collection.insert_one(op_in.dict(by_alias=True))

        # Notify admin of task completion (if completed by someone else)
        if task.collaborator_id != task.admin_id:
            await NotificationService.create_notification(
                user_id=task.admin_id,
                title="Tâche terminée",
                message=f"La tâche '{task.title}' a été marquée comme terminée.",
                type="task_completed"
            )

    @staticmethod
    async def _rollback_completed_task_operations(task_id: str, admin_id: str):
        task_doc = await tasks_collection.find_one({"_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id})
        if not task_doc:
            return

        task = Task(**task_doc)

        # 1. Delete associated operations
        await operations_collection.delete_many({"note": {"$regex": f"Task completion.*: {task_id}"}})

        # 2. Restore products
        if task.type == "vente" and task.product_id:
            await products_collection.update_one(
                {"_id": ObjectId(task.product_id) if ObjectId.is_valid(task.product_id) else task.product_id},
                {"$set": {
                    "is_archived": False,
                    "stock": 1,
                    "selling_price": None,
                    "client_name": None,
                    "sold_by": None,
                    "sold_at": None
                }}
            )
        elif task.type == "troc" and task.outgoing_product_id:
            # Restore outgoing product
            await products_collection.update_one(
                {"_id": ObjectId(task.outgoing_product_id) if ObjectId.is_valid(task.outgoing_product_id) else task.outgoing_product_id},
                {"$set": {
                    "is_archived": False,
                    "stock": 1,
                    "selling_price": None,
                    "client_name": None,
                    "sold_by": None,
                    "sold_at": None
                }}
            )
            # Delete incoming product (as if it never existed)
            if task.incoming_product_imei:
                await products_collection.delete_one({
                    "admin_id": admin_id,
                    "imei": task.incoming_product_imei,
                    "name": task.incoming_product_name
                })

        # Notify admin of rollback (if modified by collaborator)
        # This is optional but good for transparency if they watch notifications
        if task.collaborator_id != task.admin_id:
            await NotificationService.create_notification(
                user_id=task.admin_id,
                title="Tâche réinitialisée",
                message=f"Le statut de la tâche '{task.title}' a été modifié, les opérations liées ont été annulées.",
                type="task_updated"
            )

    @staticmethod
    async def delete_task(task_id: str, admin_id: str):
        # Perform cleanup before deletion
        await TaskService._cleanup_task_resources(task_id, admin_id)
        
        result = await tasks_collection.delete_one({
            "_id": ObjectId(task_id) if ObjectId.is_valid(task_id) else task_id,
            "admin_id": admin_id
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
