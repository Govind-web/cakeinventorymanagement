from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.purchase import Purchase
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.services.purchase_service import create_purchase, receive_purchase
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.get("", response_model=List[PurchaseResponse])
def list_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    return db.query(Purchase).order_by(Purchase.created_at.desc()).all()

@router.get("/{id}", response_model=PurchaseResponse)
def get_purchase(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    purchase = db.query(Purchase).filter(Purchase.id == id).first()
    if not purchase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
    return purchase

@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_new_purchase(
    purchase_in: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    return create_purchase(db, purchase_in)

@router.post("/{id}/receive", response_model=PurchaseResponse)
def mark_purchase_received(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    return receive_purchase(db, id, user_id=current_user.id)
