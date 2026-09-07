from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Supplier).all()

@router.get("/{id}", response_model=SupplierResponse)
def get_supplier(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sup = db.query(Supplier).filter(Supplier.id == id).first()
    if not sup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return sup

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    sup_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    sup = Supplier(**sup_in.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup

@router.put("/{id}", response_model=SupplierResponse)
def update_supplier(
    id: int,
    sup_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    sup = db.query(Supplier).filter(Supplier.id == id).first()
    if not sup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    update_data = sup_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(sup, field, val)

    db.commit()
    db.refresh(sup)
    return sup

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    sup = db.query(Supplier).filter(Supplier.id == id).first()
    if not sup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    db.delete(sup)
    db.commit()
    return None
