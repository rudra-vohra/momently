from typing import Annotated, List
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Event(Document):
    name: str
    description: str | None = None
    admin_id: Annotated[PydanticObjectId, Indexed()]
    team_member_ids: List[PydanticObjectId] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "events"