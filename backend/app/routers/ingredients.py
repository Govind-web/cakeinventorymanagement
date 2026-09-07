from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.ingredient import Ingredient
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, IngredientResponse
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

@router.get("", response_model=List[IngredientResponse])
def list_ingredients(
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ingredient)
    if supplier_id:
        query = query.filter(Ingredient.supplier_id == supplier_id)
    return query.all()

@router.get("/{id}", response_model=IngredientResponse)
def get_ingredient(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    return ing

@router.post("", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    ing_in: IngredientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    if ing_in.supplier_id:
        sup = db.query(Supplier).filter(Supplier.id == ing_in.supplier_id).first()
        if not sup:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    ing = Ingredient(**ing_in.model_dump())
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing

@router.put("/{id}", response_model=IngredientResponse)
def update_ingredient(
    id: int,
    ing_in: IngredientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    update_data = ing_in.model_dump(exclude_unset=True)
    if "supplier_id" in update_data and update_data["supplier_id"] is not None:
        sup = db.query(Supplier).filter(Supplier.id == update_data["supplier_id"]).first()
        if not sup:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    for field, val in update_data.items():
        setattr(ing, field, val)

    db.commit()
    db.refresh(ing)
    return ing

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    db.delete(ing)
    db.commit()
    return None
