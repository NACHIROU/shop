from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os
import dotenv

dotenv.load_dotenv()

class Settings(BaseSettings):
    # MongoDB
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    database_name: str = "shopmanager"

    # JWT
    secret_key: str = "" + os.getenv("SECRET_KEY", "")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = 60 * 24 * 7
    refresh_token_expire_days: int = 7
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
