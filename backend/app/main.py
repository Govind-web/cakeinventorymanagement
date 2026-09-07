from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth,
    users,
    categories,
    products,
    ingredients,
    recipes,
    suppliers,
    purchases,
    sales,
    production,
    inventory,
    dashboard,
)

def ensure_schema_migrations():
    with engine.connect() as conn:
        try:
            cursor = conn.exec_driver_sql("PRAGMA table_info(users)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns and "manager_id" not in columns:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id)")
                conn.commit()
        except Exception as e:
            print("Migration check notice:", e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists (creates tables if missing)
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()
    # Seed initial default data idempotently
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(ingredients.router, prefix=settings.API_V1_STR)
app.include_router(recipes.router, prefix=settings.API_V1_STR)
app.include_router(suppliers.router, prefix=settings.API_V1_STR)
app.include_router(purchases.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(production.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Pastry & Cake Inventory Management System API is running",
        "docs": "/docs",
        "health": "OK"
    }
