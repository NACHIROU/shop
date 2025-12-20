from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth import UserCreate, UserLogin, CollaboratorCreate, AuthResponse, UserResponse, CollaboratorResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_admin, get_current_admin_or_collaborator
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register_admin(user_data: UserCreate):
    return await AuthService.register_admin(user_data)

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    return await AuthService.login(user_data)

@router.post("/collaborators", response_model=UserResponse)
async def create_collaborator(
    collab_data: CollaboratorCreate,
    current_admin: User = Depends(get_current_admin)
):
    user = await AuthService.create_collaborator(str(current_admin.id), collab_data)
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

@router.get("/collaborators", response_model=list[CollaboratorResponse])
async def get_collaborators(current_admin: User = Depends(get_current_admin)):
    users = await AuthService.get_users_by_admin(str(current_admin.id))
    collaborators = []
    for user in users:
        # Calculate tasks
        from app.db.mongo import tasks_collection
        completed = await tasks_collection.count_documents({"collaborator_id": str(user.id), "status": "completed"})
        in_progress = await tasks_collection.count_documents({"collaborator_id": str(user.id), "status": "in_progress"})
        
        collaborators.append(CollaboratorResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            tasks_completed=completed,
            tasks_in_progress=in_progress,
            joined_at=user.created_at.isoformat()
        ))
    return collaborators

@router.post("/change-password")
async def change_password(
    new_password: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    await AuthService.change_password(str(current_user.id), new_password)
    return {"message": "Password changed successfully"}
