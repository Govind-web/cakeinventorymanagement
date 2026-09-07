from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.sale import Sale
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sales_service import create_sale
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("", response_model=List[SaleResponse])
def list_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ADMIN, MANAGER, STAFF
):
    return db.query(Sale).order_by(Sale.created_at.desc()).all()

@router.get("/{id}", response_model=SaleResponse)
def get_sale(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == id).first()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
    return sale

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_new_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ADMIN, MANAGER, STAFF can make sales
):
    return create_sale(db, sale_in, user_id=current_user.id)
