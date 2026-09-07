from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.product import ProductResponse
from app.schemas.user import UserResponse

class SaleItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_price: Optional[float] = None  # If not provided, backend uses product.selling_price

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(BaseModel):
    id: int
    sale_id: int
    product_id: int
    quantity: float
    unit_price: float
    total_price: float
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    items: List[SaleItemCreate]

class SaleResponse(BaseModel):
    id: int
    customer_name: Optional[str] = None
    sale_date: datetime
    total_amount: float
    created_by: Optional[int] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True
