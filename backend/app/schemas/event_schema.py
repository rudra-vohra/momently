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

    model_config = ConfigDict(from_attributes=True)



class EventDetailResponse(EventResponse):
    admin: UserSummary
    team_members: List[UserSummary]
