from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase
from app.models.category import Category


def _calc_profit(db: Session, date_filter=None) -> float:
    """
    Profit = sum(sale_item.total_price) - sum(sale_item.quantity * product.cost_price)
    """
    query = db.query(
        SaleItem.total_price,
        SaleItem.quantity,
        Product.cost_price
    ).join(Product, SaleItem.product_id == Product.id)

    if date_filter is not None:
        query = query.join(Sale, SaleItem.sale_id == Sale.id).filter(Sale.sale_date >= date_filter)

    rows = query.all()
    revenue = sum(r.total_price for r in rows)
    cogs = sum(r.quantity * r.cost_price for r in rows)
    return round(revenue - cogs, 2)


def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)
    seven_days_ahead = now + timedelta(days=7)

    # Basic counts
    products = db.query(Product).all()
    ingredients = db.query(Ingredient).all()

    total_products = len(products)
    total_ingredients = len(ingredients)

    low_stock_products = [
        {"id": p.id, "name": p.name, "quantity": p.quantity, "minimum_stock": p.minimum_stock}
        for p in products if p.quantity <= p.minimum_stock
    ]
    out_of_stock_products = [
        {"id": p.id, "name": p.name, "quantity": p.quantity}
        for p in products if p.quantity <= 0
    ]

    low_stock_ingredients = [
        {"id": i.id, "name": i.name, "unit": i.unit, "quantity": i.quantity, "minimum_quantity": i.minimum_quantity}
        for i in ingredients if i.quantity <= i.minimum_quantity
    ]

    # Sales stats
    sales_today = db.query(func.sum(Sale.total_amount)).filter(Sale.sale_date >= today_start).scalar() or 0.0
    sales_month = db.query(func.sum(Sale.total_amount)).filter(Sale.sale_date >= month_start).scalar() or 0.0

    # Purchase stats
    purchase_month = db.query(func.sum(Purchase.total_amount)).filter(
        Purchase.created_at >= month_start,
        Purchase.status == "RECEIVED"
    ).scalar() or 0.0

    # Profit calculation
    profit_today = _calc_profit(db, date_filter=today_start)
    profit_this_month = _calc_profit(db, date_filter=month_start)

    # Inventory Valuation (Products cost/price + Ingredients cost)
    products_valuation = sum(p.quantity * p.cost_price for p in products)
    ingredients_valuation = sum(i.quantity * i.cost_per_unit for i in ingredients)
    total_inventory_value = products_valuation + ingredients_valuation

    # Top selling products (with revenue per product for pie chart)
    top_selling_raw = db.query(
        SaleItem.product_id,
        Product.name,
        func.sum(SaleItem.quantity).label("total_sold"),
        func.sum(SaleItem.total_price).label("total_revenue")
    ).join(Product, SaleItem.product_id == Product.id)\
     .group_by(SaleItem.product_id, Product.name)\
     .order_by(func.sum(SaleItem.quantity).desc())\
     .limit(5).all()

    top_selling_products = [
        {
            "product_id": item[0],
            "name": item[1],
            "total_sold": float(item[2]),
            "total_revenue": round(float(item[3]), 2)
        }
        for item in top_selling_raw
    ]

    # Recent sales (last 5)
    recent_sales_models = db.query(Sale).order_by(Sale.created_at.desc()).limit(5).all()
    recent_sales = [
        {
            "id": s.id,
            "customer_name": s.customer_name,
            "total_amount": s.total_amount,
            "sale_date": s.sale_date,
            "item_count": len(s.items)
        }
        for s in recent_sales_models
    ]

    # Recent purchases (last 5)
    recent_purchases_models = db.query(Purchase).order_by(Purchase.created_at.desc()).limit(5).all()
    recent_purchases = [
        {
            "id": p.id,
            "supplier_name": p.supplier.name if p.supplier else "N/A",
            "total_amount": p.total_amount,
            "status": p.status,
            "purchase_date": p.purchase_date
        }
        for p in recent_purchases_models
    ]

    # Expiring products/ingredients
    expiring_products = [
        {"id": p.id, "name": p.name, "expiry_date": p.expiry_date}
        for p in products if p.expiry_date and p.expiry_date <= seven_days_ahead
    ]

    return {
        "total_products": total_products,
        "total_ingredients": total_ingredients,
        "low_stock_products": low_stock_products,
        "low_stock_ingredients": low_stock_ingredients,
        "out_of_stock_products": out_of_stock_products,
        "total_sales_today": float(sales_today),
        "total_sales_this_month": float(sales_month),
        "total_purchase_this_month": float(purchase_month),
        "total_inventory_value": round(float(total_inventory_value), 2),
        "profit_today": profit_today,
        "profit_this_month": profit_this_month,
        "top_selling_products": top_selling_products,
        "recent_sales": recent_sales,
        "recent_purchases": recent_purchases,
        "expiring_products": expiring_products
    }

