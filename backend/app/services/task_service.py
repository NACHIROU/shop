from app.db.mongo import tasks_collection, users_collection, products_collection
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from typing import List
from fastapi import HTTPException
from datetime import datetime

class TaskService:
    @staticmethod
    async def create_task(admin_id: str, task_data: TaskCreate) -> Task:
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
            date=task_data.date
        )
        result = await tasks_collection.insert_one(task.dict(by_alias=True))
        task.id = result.inserted_id
        return task

    @staticmethod
    async def get_tasks(admin_id: str, collaborator_id: str = None) -> List[TaskResponse]:
        query = {"admin_id": admin_id}
        if collaborator_id:
            query["collaborator_id"] = collaborator_id
        
        cursor = tasks_collection.find(query)
        tasks = []
        async for doc in cursor:
            task = Task(**doc)
            # Get assigned user name
            user = await users_collection.find_one({"_id": task.collaborator_id})
            assigned_name = user["name"] if user else "Unknown"
            
            # Get product name
            product_name = None
            if task.product_id:
                product = await products_collection.find_one({"_id": task.product_id, "admin_id": admin_id})
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
                updated_at=task.updated_at.isoformat()
            ))
        return tasks

    @staticmethod
    async def get_task_by_id(task_id: str, admin_id: str) -> TaskResponse:
        doc = await tasks_collection.find_one({"_id": task_id, "admin_id": admin_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Task not found")
        task = Task(**doc)
        user = await users_collection.find_one({"_id": task.collaborator_id})
        assigned_name = user["name"] if user else "Unknown"
        product_name = None
        if task.product_id:
            product = await products_collection.find_one({"_id": task.product_id, "admin_id": admin_id})
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
            updated_at=task.updated_at.isoformat()
        )

    @staticmethod
    async def update_task(task_id: str, admin_id: str, update_data: TaskUpdate) -> TaskResponse:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        if "assigned_to" in update_dict:
            update_dict["collaborator_id"] = update_dict.pop("assigned_to")
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            await tasks_collection.update_one(
                {"_id": task_id, "admin_id": admin_id},
                {"$set": update_dict}
            )
        return await TaskService.get_task_by_id(task_id, admin_id)

    @staticmethod
    async def update_task_status(task_id: str, admin_id: str, status: str) -> TaskResponse:
        await tasks_collection.update_one(
            {"_id": task_id, "admin_id": admin_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        return await TaskService.get_task_by_id(task_id, admin_id)

    @staticmethod
    async def delete_task(task_id: str, admin_id: str):
        result = await tasks_collection.delete_one({"_id": task_id, "admin_id": admin_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
