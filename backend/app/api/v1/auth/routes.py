from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth import (
    UserCreate, UserLogin, CollaboratorCreate, AuthResponse, 
    UserResponse, CollaboratorResponse, InviteLinkResponse,
    ActivateAccountRequest, CollaboratorUpdate
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_admin, get_current_admin_or_collaborator, get_current_superadmin
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

@router.put("/collaborators/{collaborator_id}", response_model=UserResponse)
async def update_collaborator(
    collaborator_id: str,
    collab_data: CollaboratorUpdate,
    current_admin: User = Depends(get_current_admin)
):
    user = await AuthService.update_collaborator(collaborator_id, str(current_admin.id), collab_data)
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

@router.delete("/collaborators/{collaborator_id}")
async def delete_collaborator(
    collaborator_id: str,
    current_admin: User = Depends(get_current_admin)
):
    await AuthService.delete_collaborator(collaborator_id, str(current_admin.id))
    return {"message": "Collaborator deleted successfully"}

@router.post("/collaborators/{collaborator_id}/invite-link", response_model=InviteLinkResponse)
async def generate_invite_link(
    collaborator_id: str,
    current_admin: User = Depends(get_current_admin)
):
    """Generate an invite link for a collaborator to activate their account"""
    token = await AuthService.generate_invite_token(collaborator_id)
    # In production, this would be your actual frontend URL
    invite_url = f"http://localhost:5173/activate?token={token}"
    
    return InviteLinkResponse(
        invite_token=token,
        invite_url=invite_url,
        collaborator_id=collaborator_id
    )

@router.post("/verify-invite/{token}")
async def verify_invite(token: str):
    """Verify if an invite token is valid and return user info"""
    user_data = await AuthService.verify_invite_token(token)
    return user_data

@router.post("/activate", response_model=AuthResponse)
async def activate_account(request: ActivateAccountRequest):
    """Activate a collaborator account with a new password"""
    return await AuthService.activate_collaborator_with_password(
        request.token,
        request.new_password
    )

@router.get("/collaborators", response_model=list[CollaboratorResponse])
async def get_collaborators(current_admin: User = Depends(get_current_admin)):
    users = await AuthService.get_users_by_admin(str(current_admin.id))
    collaborators = []
    for user in users:
        # Calculate tasks
        from app.db.mongo import tasks_collection
        from bson import ObjectId
        completed = await tasks_collection.count_documents({
            "collaborator_id": str(user.id), 
            "status": "completed"
        })
        in_progress = await tasks_collection.count_documents({
            "collaborator_id": str(user.id), 
            "status": "in_progress"
        })
        
        collaborators.append(CollaboratorResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            tasks_completed=completed,
            tasks_in_progress=in_progress,
            joined_at=user.created_at.isoformat(),
            is_active=user.is_active
        ))
    return collaborators

@router.post("/change-password")
async def change_password(
    new_password: str,
    current_user: User = Depends(get_current_admin_or_collaborator)
):
    await AuthService.change_password(str(current_user.id), new_password)
    return {"message": "Password changed successfully"}
@router.post("/merchants", response_model=UserResponse)
async def create_merchant(
    merchant_data: UserCreate,
    current_superadmin: User = Depends(get_current_superadmin)
):
    user = await AuthService.create_merchant(merchant_data)
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

@router.get("/merchants", response_model=list[UserResponse])
async def get_merchants(current_superadmin: User = Depends(get_current_superadmin)):
    merchants = await AuthService.get_all_merchants()
    return [
        UserResponse(
            id=str(m.id),
            name=m.name,
            email=m.email,
            phone=m.phone,
            role=m.role,
            is_active=m.is_active,
            created_at=m.created_at.isoformat()
        ) for m in merchants
    ]

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    current_superadmin: User = Depends(get_current_superadmin)
):
    new_status = await AuthService.toggle_user_active_status(user_id)
    return {"message": "Status updated", "is_active": new_status}

@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    current_superadmin: User = Depends(get_current_superadmin)
):
    await AuthService.reset_user_password(user_id)
    return {"message": "Password reset requested. User must change password at next login."}
