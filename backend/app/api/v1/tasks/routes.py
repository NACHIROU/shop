from fastapi import APIRouter, Depends, Query, Body
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService
from app.core.dependencies import get_current_admin, get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    task = await TaskService.create_task(admin_id, task_data)
    return await TaskService.get_task_by_id(str(task.id), admin_id)

@router.get("/", response_model=list[TaskResponse])
async def get_tasks(
    collaborator_id: str = Query(None),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await TaskService.get_tasks(admin_id, collaborator_id)

@router.get("/my", response_model=list[TaskResponse])
async def get_my_tasks(
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    collaborator_id = str(current_user.id) if current_user.role == "collaborator" else None
    return await TaskService.get_tasks(admin_id, collaborator_id)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await TaskService.get_task_by_id(task_id, admin_id)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await TaskService.update_task(task_id, admin_id, task_data)

@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    return await TaskService.update_task_status(task_id, admin_id, status)

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    admin_id = str(current_user.id) if current_user.role == "admin" else current_user.admin_id
    await TaskService.delete_task(task_id, admin_id)
    return {"message": "Task deleted successfully"}
