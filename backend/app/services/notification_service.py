from app.db.mongo import notifications_collection
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationResponse
from typing import List
from bson import ObjectId
from datetime import datetime

class NotificationService:
    @staticmethod
    async def create_notification(user_id: str, title: str, message: str, type: str) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type
        )
        result = await notifications_collection.insert_one(notification.dict(by_alias=True))
        notification.id = result.inserted_id
        return notification

    @staticmethod
    async def get_notifications(user_id: str) -> List[NotificationResponse]:
        cursor = notifications_collection.find({"user_id": user_id}).sort("created_at", -1).limit(50)
        notifications = []
        async for doc in cursor:
            notifications.append(NotificationResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                title=doc["title"],
                message=doc["message"],
                type=doc["type"],
                is_read=doc["is_read"],
                created_at=doc["created_at"].isoformat()
            ))
        return notifications

    @staticmethod
    async def mark_as_read(notification_id: str, user_id: str):
        await notifications_collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"is_read": True}}
        )

    @staticmethod
    async def mark_all_as_read(user_id: str):
        await notifications_collection.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
