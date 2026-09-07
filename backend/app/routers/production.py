from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.inventory import ProductionRequest
from app.services.production_service import produce_product
from app.dependencies.auth_dependencies import require_roles

router = APIRouter(prefix="/production", tags=["Production"])

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def trigger_production(
    req: ProductionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    return produce_product(db, req, user_id=current_user.id)
