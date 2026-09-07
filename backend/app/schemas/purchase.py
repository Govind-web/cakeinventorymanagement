from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.supplier import SupplierResponse
from app.schemas.ingredient import IngredientResponse

class PurchaseItemBase(BaseModel):
    ingredient_id: int
    quantity: float
    unit_price: float

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    purchase_id: int
    total_price: float
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True

class PurchaseBase(BaseModel):
    supplier_id: int
    purchase_date: Optional[datetime] = None

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]

class PurchaseResponse(PurchaseBase):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    supplier: Optional[SupplierResponse] = None
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True
