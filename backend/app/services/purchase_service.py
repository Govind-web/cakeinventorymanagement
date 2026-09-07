from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.purchase import Purchase, PurchaseItem
from app.models.ingredient import Ingredient
from app.models.supplier import Supplier
from app.schemas.purchase import PurchaseCreate
from app.services.inventory_service import create_inventory_transaction

def create_purchase(db: Session, purchase_in: PurchaseCreate) -> Purchase:
    supplier = db.query(Supplier).filter(Supplier.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    total_amount = 0.0
    items_to_create = []

    for item in purchase_in.items:
        ing = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
        if not ing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingredient with ID {item.ingredient_id} not found"
            )
        line_total = item.quantity * item.unit_price
        total_amount += line_total
        items_to_create.append(
            PurchaseItem(
                ingredient_id=item.ingredient_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=line_total
            )
        )

    purchase = Purchase(
        supplier_id=purchase_in.supplier_id,
        purchase_date=purchase_in.purchase_date,
        total_amount=total_amount,
        status="PENDING",
        items=items_to_create
    )

    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


def receive_purchase(db: Session, purchase_id: int, user_id: Optional[int] = None) -> Purchase:
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")

    if purchase.status == "RECEIVED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Purchase is already received")

    if purchase.status == "CANCELLED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot receive a cancelled purchase")

    try:
        purchase.status = "RECEIVED"
        
        for item in purchase.items:
            ingredient = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
            if ingredient:
                # Update stock and cost per unit
                ingredient.quantity += item.quantity
                ingredient.cost_per_unit = item.unit_price
                
                # Log transaction
                create_inventory_transaction(
                    db=db,
                    item_type="INGREDIENT",
                    item_id=ingredient.id,
                    transaction_type="PURCHASE",
                    quantity=item.quantity,
                    reference_id=f"PURCHASE-{purchase.id}",
                    note=f"Received purchase order #{purchase.id} from supplier",
                    created_by=user_id
                )

        db.commit()
        db.refresh(purchase)
        return purchase
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
