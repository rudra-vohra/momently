import os
from urllib.parse import urlsplit, urlunsplit

import pytest
import pytest_asyncio
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.main import app
from app.models.event import Event
from app.models.gallery import Gallery
from app.models.photo import Photo
from app.models.user import User


def _default_test_mongo_uri() -> str:
    """Return the real MongoDB URI with the test database substituted."""
    parsed_uri = urlsplit(settings.mongo_uri)
    return urlunsplit(
        parsed_uri._replace(path="/photo_sharing_test_db")
    )


@pytest_asyncio.fixture(scope="function", autouse=True)
async def test_db():
    """Initialize an isolated Beanie database for each test and clean it up."""
    mongo_uri = os.getenv("TEST_MONGO_URI", _default_test_mongo_uri())
    client = AsyncIOMotorClient(mongo_uri)
    database = client.get_default_database()

    await init_beanie(
        database=database,
        document_models=[User, Event, Photo, Gallery],
    )

    try:
        yield database
    finally:
        await User.get_pymongo_collection().drop()
        await Event.get_pymongo_collection().drop()
        await Photo.get_pymongo_collection().drop()
        await Gallery.get_pymongo_collection().drop()
        client.close()

@pytest_asyncio.fixture
async def client(test_db):
    """Provide an async HTTP client that calls the FastAPI app in-process."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as async_client:
        yield async_client