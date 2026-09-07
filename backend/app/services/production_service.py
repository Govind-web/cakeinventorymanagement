from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.schemas.inventory import ProductionRequest, ProductionResponse
from app.services.inventory_service import create_inventory_transaction

def produce_product(db: Session, request: ProductionRequest, user_id: Optional[int] = None) -> Dict[str, Any]:
    if request.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Production quantity must be greater than zero"
        )

    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    recipe = db.query(Recipe).filter(Recipe.product_id == request.product_id).first()
    if not recipe or not recipe.recipe_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No recipe found for product '{product.name}'. Please create a recipe first."
        )

    # Step 1: Check ingredient availability
    missing_ingredients = []
    required_materials = []

    for item in recipe.recipe_items:
        ingredient = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
        if not ingredient:
            missing_ingredients.append(f"Ingredient ID {item.ingredient_id} missing")
            continue

        needed_qty = item.quantity_required * request.quantity
        if ingredient.quantity < needed_qty:
            missing_ingredients.append(
                f"{ingredient.name}: needed {needed_qty} {ingredient.unit}, available {ingredient.quantity} {ingredient.unit}"
            )
        
        required_materials.append({
            "ingredient": ingredient,
            "needed_qty": needed_qty
        })

    if missing_ingredients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"Insufficient raw materials to produce {request.quantity} x {product.name}",
                "error_code": "INSUFFICIENT_INGREDIENTS",
                "missing": missing_ingredients
            }
        )

    # Step 2: Atomic Execution
    consumed_list = []
    try:
        for mat in required_materials:
            ing = mat["ingredient"]
            qty = mat["needed_qty"]

            # Deduct ingredient
            ing.quantity -= qty

            # Log transaction
            create_inventory_transaction(
                db=db,
                item_type="INGREDIENT",
                item_id=ing.id,
                transaction_type="PRODUCTION",
                quantity=-qty,
                reference_id=f"PROD-PROD{product.id}",
                note=f"Used in production of {request.quantity} x {product.name}",
                created_by=user_id
            )

            consumed_list.append({
                "ingredient_id": ing.id,
                "ingredient_name": ing.name,
                "quantity_consumed": qty,
                "unit": ing.unit
            })

        # Increase finished product stock
        product.quantity += request.quantity

        # Log transaction for product
        create_inventory_transaction(
            db=db,
            item_type="PRODUCT",
            item_id=product.id,
            transaction_type="PRODUCTION",
            quantity=request.quantity,
            reference_id=f"PROD-PROD{product.id}",
            note=f"Produced {request.quantity} units of {product.name}",
            created_by=user_id
        )

        db.commit()
        db.refresh(product)

        return {
            "success": True,
            "message": f"Successfully produced {request.quantity} x {product.name}",
            "product_id": product.id,
            "product_name": product.name,
            "produced_quantity": request.quantity,
            "new_product_stock": product.quantity,
            "consumed_ingredients": consumed_list
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
