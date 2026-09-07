from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.inventory import InventoryTransaction
from app.models.product import Product
from app.models.ingredient import Ingredient

def create_inventory_transaction(
    db: Session,
    item_type: str,
    item_id: int,
    transaction_type: str,
    quantity: float,
    reference_id: Optional[str] = None,
    note: Optional[str] = None,
    created_by: Optional[int] = None
) -> InventoryTransaction:
    txn = InventoryTransaction(
        item_type=item_type.upper(),
        item_id=item_id,
        transaction_type=transaction_type.upper(),
        quantity=quantity,
        reference_id=str(reference_id) if reference_id is not None else None,
        note=note,
        created_by=created_by,
        created_at=datetime.utcnow()
    )
    db.add(txn)
    return txn

from app.schemas.product import ProductResponse
from app.schemas.ingredient import IngredientResponse

def get_inventory_summary(db: Session):
    products = db.query(Product).all()
    ingredients = db.query(Ingredient).all()

    prod_responses = [ProductResponse.model_validate(p).model_dump(mode='json') for p in products]
    ing_responses = [IngredientResponse.model_validate(i).model_dump(mode='json') for i in ingredients]

    low_stock_products = [p for p in prod_responses if p['quantity'] <= p['minimum_stock']]
    out_of_stock_products = [p for p in prod_responses if p['quantity'] <= 0]
    
    low_stock_ingredients = [i for i in ing_responses if i['quantity'] <= i['minimum_quantity']]
    out_of_stock_ingredients = [i for i in ing_responses if i['quantity'] <= 0]

    return {
        "products": prod_responses,
        "ingredients": ing_responses,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "low_stock_ingredients": low_stock_ingredients,
        "out_of_stock_ingredients": out_of_stock_ingredients,
    }

def get_expiring_items(db: Session, days_ahead: int = 7):
    threshold = datetime.utcnow() + timedelta(days=days_ahead)
    expiring_products = db.query(Product).filter(
        Product.expiry_date.isnot(None),
        Product.expiry_date <= threshold
    ).all()
    
    expiring_ingredients = db.query(Ingredient).filter(
        Ingredient.expiry_date.isnot(None),
        Ingredient.expiry_date <= threshold
    ).all()

    return {
        "expiring_products": [ProductResponse.model_validate(p).model_dump(mode='json') for p in expiring_products],
        "expiring_ingredients": [IngredientResponse.model_validate(i).model_dump(mode='json') for i in expiring_ingredients]
    }

