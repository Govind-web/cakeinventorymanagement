from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate
from app.services.inventory_service import create_inventory_transaction

def create_sale(db: Session, sale_in: SaleCreate, user_id: Optional[int] = None) -> Sale:
    if not sale_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sale must contain at least one item")

    # Step 1: Validate all items stock first
    items_data = []
    total_amount = 0.0

    for item in sale_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )

        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Insufficient stock for {product.name}. Available: {product.quantity}, Requested: {item.quantity}",
                    "error_code": "INSUFFICIENT_STOCK"
                }
            )

        price = item.unit_price if item.unit_price is not None else product.selling_price
        line_total = price * item.quantity
        total_amount += line_total

        items_data.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": price,
            "total_price": line_total
        })

    # Step 2: Atomic DB Transaction to deduct stock and record Sale
    try:
        sale = Sale(
            customer_name=sale_in.customer_name or "Walk-in Customer",
            total_amount=total_amount,
            created_by=user_id
        )
        db.add(sale)
        db.flush()  # get sale.id

        for data in items_data:
            product = data["product"]
            qty = data["quantity"]

            # Deduct stock
            product.quantity -= qty

            # Create SaleItem
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=qty,
                unit_price=data["unit_price"],
                total_price=data["total_price"]
            )
            db.add(sale_item)

            # Record Inventory Transaction (negative quantity)
            create_inventory_transaction(
                db=db,
                item_type="PRODUCT",
                item_id=product.id,
                transaction_type="SALE",
                quantity=-qty,
                reference_id=f"SALE-{sale.id}",
                note=f"Sale #{sale.id} to {sale.customer_name}",
                created_by=user_id
            )

        db.commit()
        db.refresh(sale)
        return sale
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
