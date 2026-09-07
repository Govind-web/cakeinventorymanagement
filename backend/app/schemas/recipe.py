from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.ingredient import IngredientResponse
from app.schemas.product import ProductResponse

class RecipeItemBase(BaseModel):
    ingredient_id: int
    quantity_required: float

class RecipeItemCreate(RecipeItemBase):
    pass

class RecipeItemResponse(RecipeItemBase):
    id: int
    recipe_id: int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True

class RecipeBase(BaseModel):
    product_id: int
    instructions: Optional[str] = None

class RecipeCreate(RecipeBase):
    items: List[RecipeItemCreate]

class RecipeUpdate(BaseModel):
    instructions: Optional[str] = None
    items: Optional[List[RecipeItemCreate]] = None

class RecipeResponse(RecipeBase):
    id: int
    created_at: datetime
    product: Optional[ProductResponse] = None
    recipe_items: List[RecipeItemResponse] = []

    class Config:
        from_attributes = True
