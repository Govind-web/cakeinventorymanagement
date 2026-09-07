from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.supplier import SupplierResponse

class IngredientBase(BaseModel):
    name: str
    unit: str  # KG, GRAM, LITER, ML, PIECE
    quantity: float = 0.0
    minimum_quantity: float = 10.0
    cost_per_unit: float = 0.0
    expiry_date: Optional[datetime] = None
    supplier_id: Optional[int] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    minimum_quantity: Optional[float] = None
    cost_per_unit: Optional[float] = None
    expiry_date: Optional[datetime] = None
    supplier_id: Optional[int] = None

class IngredientResponse(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True
