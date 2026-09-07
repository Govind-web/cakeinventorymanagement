from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.category import CategoryResponse

class ProductBase(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None
    selling_price: float
    cost_price: float = 0.0
    quantity: float = 0.0
    minimum_stock: float = 5.0
    expiry_date: Optional[datetime] = None
    is_available: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    quantity: Optional[float] = None
    minimum_stock: Optional[float] = None
    expiry_date: Optional[datetime] = None
    is_available: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
