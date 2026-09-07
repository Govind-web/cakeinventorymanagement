from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(String, nullable=True)
    selling_price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)
    quantity = Column(Float, default=0.0)
    minimum_stock = Column(Float, default=5.0)
    expiry_date = Column(DateTime, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    recipe = relationship("Recipe", back_populates="product", uselist=False, cascade="all, delete-orphan")
    sale_items = relationship("SaleItem", back_populates="product")
