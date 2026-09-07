from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.recipe import Recipe, RecipeItem
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeResponse
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("", response_model=List[RecipeResponse])
def list_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Recipe).all()

@router.get("/{product_id}", response_model=RecipeResponse)
def get_recipe_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found for this product")
    return recipe

@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    product = db.query(Product).filter(Product.id == recipe_in.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = db.query(Recipe).filter(Recipe.product_id == recipe_in.product_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Recipe already exists for this product")

    # Validate ingredients
    recipe_items = []
    for item in recipe_in.items:
        ing = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
        if not ing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingredient with ID {item.ingredient_id} not found"
            )
        recipe_items.append(
            RecipeItem(ingredient_id=item.ingredient_id, quantity_required=item.quantity_required)
        )

    recipe = Recipe(
        product_id=recipe_in.product_id,
        instructions=recipe_in.instructions,
        recipe_items=recipe_items
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe

@router.put("/{id}", response_model=RecipeResponse)
def update_recipe(
    id: int,
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    recipe = db.query(Recipe).filter(Recipe.id == id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    if recipe_in.instructions is not None:
        recipe.instructions = recipe_in.instructions

    if recipe_in.items is not None:
        # Clear existing items
        db.query(RecipeItem).filter(RecipeItem.recipe_id == recipe.id).delete()
        new_items = []
        for item in recipe_in.items:
            ing = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
            if not ing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ingredient with ID {item.ingredient_id} not found"
                )
            new_items.append(
                RecipeItem(recipe_id=recipe.id, ingredient_id=item.ingredient_id, quantity_required=item.quantity_required)
            )
        db.add_all(new_items)

    db.commit()
    db.refresh(recipe)
    return recipe

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    recipe = db.query(Recipe).filter(Recipe.id == id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    db.delete(recipe)
    db.commit()
    return None
