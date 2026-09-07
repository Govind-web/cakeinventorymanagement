import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pastry & Cake Inventory Management System"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./bakery.db"
    SECRET_KEY: str = "bakery_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
