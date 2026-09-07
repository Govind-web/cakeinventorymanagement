from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    item_type = Column(String, nullable=False)  # PRODUCT, INGREDIENT
    item_id = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)  # PURCHASE, SALE, PRODUCTION, WASTAGE, ADJUSTMENT, RETURN
    quantity = Column(Float, nullable=False)  # positive (increase) or negative (decrease)
    reference_id = Column(String, nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User")
