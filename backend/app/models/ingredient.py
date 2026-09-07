from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    unit = Column(String, nullable=False)  # KG, GRAM, LITER, ML, PIECE
    quantity = Column(Float, default=0.0)
    minimum_quantity = Column(Float, default=10.0)
    cost_per_unit = Column(Float, default=0.0)
    expiry_date = Column(DateTime, nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="ingredients")
    recipe_items = relationship("RecipeItem", back_populates="ingredient")
    purchase_items = relationship("PurchaseItem", back_populates="ingredient")
