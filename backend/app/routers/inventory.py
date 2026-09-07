from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.inventory import InventoryTransaction
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.inventory import InventoryTransactionResponse
from app.schemas.product import ProductResponse
from app.schemas.ingredient import IngredientResponse
from app.services.inventory_service import get_inventory_summary, get_expiring_items
from app.dependencies.auth_dependencies import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=Dict[str, Any])
def get_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_inventory_summary(db)

@router.get("/low-stock", response_model=Dict[str, Any])
def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_inventory_summary(db)
    return {
        "low_stock_products": summary["low_stock_products"],
        "low_stock_ingredients": summary["low_stock_ingredients"]
    }

@router.get("/out-of-stock", response_model=Dict[str, Any])
def get_out_of_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_inventory_summary(db)
    return {
        "out_of_stock_products": summary["out_of_stock_products"],
        "out_of_stock_ingredients": summary["out_of_stock_ingredients"]
    }

@router.get("/expiring-soon", response_model=Dict[str, Any])
def get_expiring(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_expiring_items(db, days_ahead=days)

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(InventoryTransaction).order_by(InventoryTransaction.created_at.desc()).all()
