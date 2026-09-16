from beanie import PydanticObjectId
from typing import Annotated, List, Literal
from beanie import Document, Indexed
from pydantic import EmailStr, Field
from datetime import datetime, timezone

class User(Document):
    name: str
    email: Annotated[EmailStr, Indexed(unique=True)]
    password_hash: str
    role: Literal["admin", "team_member"] = "team_member"
    event_ids: List[PydanticObjectId] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"

    