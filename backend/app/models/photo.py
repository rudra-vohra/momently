from typing import Annotated
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Photo(Document):
    event_id: Annotated[PydanticObjectId, Indexed()]
    uploaded_by: PydanticObjectId
    filename: str
    url: str
    thumbnail_url: str | None = None
    storage_key: str
    file_size: int
    selected_for_gallery: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "photos"