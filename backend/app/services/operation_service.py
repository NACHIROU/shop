from app.db.mongo import operations_collection
from app.models.operation import Operation
from app.schemas.operation import OperationCreate, OperationResponse
from typing import List

class OperationService:
    @staticmethod
    async def create_operation(admin_id: str, collaborator_id: str, operation_data: OperationCreate) -> Operation:
        operation = Operation(
            admin_id=admin_id,
            collaborator_id=collaborator_id,
            type=operation_data.type,
            product_id=operation_data.product_id,
            supplier_id=operation_data.supplier_id,
            quantity=operation_data.quantity,
            amount=operation_data.amount,
            operation_date=operation_data.operation_date,
            note=operation_data.note
        )
        result = await operations_collection.insert_one(operation.dict(by_alias=True))
        operation.id = result.inserted_id
        return operation

    @staticmethod
    async def get_operations(admin_id: str) -> List[OperationResponse]:
        cursor = operations_collection.find({"admin_id": admin_id})
        operations = []
        async for doc in cursor:
            operation = Operation(**doc)
            operations.append(OperationResponse(
                id=str(operation.id),
                type=operation.type,
                product_id=operation.product_id,
                supplier_id=operation.supplier_id,
                quantity=operation.quantity,
                amount=operation.amount,
                operation_date=operation.operation_date.isoformat(),
                note=operation.note,
                created_at=operation.created_at.isoformat()
            ))
        return operations
