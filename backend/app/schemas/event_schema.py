from datetime import datetime
from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, EmailStr
from app.schemas.user_schema import UserSummary


class EventCreateRequest(BaseModel):
    """Request body for creating a new event."""

    name: str
    description: Optional[str] = None


class AddTeamMemberRequest(BaseModel):
    """Request body for adding a team member to an event by email."""

    email: EmailStr


class EventResponse(BaseModel):
    """Event information returned by the API."""

    id: PydanticObjectId
    name: str
    description: Optional[str] = None
    admin_id: PydanticObjectId
    team_member_ids: List[PydanticObjectId]
    created_at: datetime
    cover_image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class EventListResponse(EventResponse):
    """Event information plus dashboard summary values."""

    photo_count: int
    selected_photo_count: int
    published_photo_count: int
    gallery_status: str
    has_unpublished_changes: bool



class EventDetailResponse(EventResponse):
    admin: UserSummary
    team_members: List[UserSummary]

class SetCoverPhotoRequest(BaseModel):
    photo_id: PydanticObjectId

