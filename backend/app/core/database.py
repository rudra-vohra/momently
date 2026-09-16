# app/core/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.event import Event
from app.models.photo import Photo
from app.models.gallery import Gallery
async def init_db():
    client = AsyncIOMotorClient(settings.mongo_uri)
    database = client.get_default_database()

    await init_beanie(
        database=database,
        document_models=[
            User,Event,Photo,Gallery
        ],
    )