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

    # SMTP (Email)
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from: str = os.getenv("SMTP_FROM", "")
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
