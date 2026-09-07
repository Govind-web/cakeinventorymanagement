from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserSummaryResponse
from app.core.security import get_password_hash
from app.dependencies.auth_dependencies import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = Query(None, description="Filter users by role (ADMIN, MANAGER, STAFF)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    return query.order_by(User.id.desc()).all()

@router.get("/managers", response_model=List[UserSummaryResponse])
def get_managers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """Returns users with MANAGER or ADMIN role to populate manager assignment dropdowns."""
    managers = db.query(User).filter(
        User.role.in_(["ADMIN", "MANAGER"]),
        User.is_active == True
    ).all()
    return managers

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    clean_username = user_in.username.strip()
    clean_email = user_in.email.strip() if user_in.email and user_in.email.strip() else f"{clean_username.lower()}@bakery.com"
    role_upper = user_in.role.upper()

    # Check for existing username
    existing_user = db.query(User).filter(User.username == clean_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{clean_username}' already exists. Please choose a different username."
        )

    # Check for existing email if provided
    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        # Append random digits to email if conflict
        import random
        clean_email = f"{clean_username.lower()}_{random.randint(100, 999)}@bakery.com"
    
    # Validate manager_id if provided
    manager_id = user_in.manager_id
    if role_upper == "ADMIN":
        manager_id = None
    elif manager_id:
        mgr = db.query(User).filter(User.id == manager_id).first()
        if not mgr:
            manager_id = None

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hashed_password,
        role=role_upper,
        manager_id=manager_id,
        is_active=user_in.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # If updating username
    if user_in.username and user_in.username.strip() != user.username:
        clean_username = user_in.username.strip()
        if db.query(User).filter(User.username == clean_username).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username '{clean_username}' is already taken")
        user.username = clean_username

    if user_in.email and user_in.email.strip() != user.email:
        clean_email = user_in.email.strip()
        if db.query(User).filter(User.email == clean_email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{clean_email}' is already registered")
        user.email = clean_email

    if user_in.role:
        user.role = user_in.role.upper()
        if user.role == "ADMIN":
            user.manager_id = None

    if user_in.manager_id is not None and user.role != "ADMIN":
        if user_in.manager_id == user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User cannot be assigned as their own manager")
        if user_in.manager_id > 0:
            mgr = db.query(User).filter(User.id == user_in.manager_id).first()
            if mgr:
                user.manager_id = user_in.manager_id
            else:
                user.manager_id = None
        else:
            user.manager_id = None
    elif "manager_id" in user_in.model_fields_set and user_in.manager_id is None:
        user.manager_id = None

    if user_in.is_active is not None:
        if user.id == current_user.id and not user_in.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own logged-in account")
        user.is_active = user_in.is_active

    if user_in.password and user_in.password.strip():
        user.password_hash = get_password_hash(user_in.password.strip())

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Remove user reference from staff members assigned to this user
    db.query(User).filter(User.manager_id == user_id).update({"manager_id": None})
    
    db.delete(user)
    db.commit()
    return None
