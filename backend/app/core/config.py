# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongo_uri: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    cors_origins: str = "http://localhost:5173"
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()