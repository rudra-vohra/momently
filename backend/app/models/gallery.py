from typing import Annotated, List
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Gallery(Document):
    event_id: Annotated[PydanticObjectId, Indexed(unique=True)]
    slug: Annotated[str, Indexed(unique=True)]
    pin_hash: str
    published_photo_ids: List[PydanticObjectId] = []
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "galleries"