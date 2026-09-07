from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import UserResponse

class InventoryTransactionResponse(BaseModel):
    id: int
    item_type: str  # PRODUCT, INGREDIENT
    item_id: int
    transaction_type: str  # PURCHASE, SALE, PRODUCTION, WASTAGE, ADJUSTMENT, RETURN
    quantity: float
    reference_id: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    created_by: Optional[int] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ProductionRequest(BaseModel):
    product_id: int
    quantity: float

class ProductionResponse(BaseModel):
    success: bool
    message: str
    product_id: int
    produced_quantity: float
    consumed_ingredients: List[Dict[str, Any]]
