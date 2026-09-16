from typing import List
from beanie.operators import In
from app.schemas.event_schema import EventDetailResponse
from app.schemas.user_schema import UserSummary
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth_deps import get_current_user, require_role
from app.models.event import Event
from app.models.user import User
from app.schemas.event_schema import (
    AddTeamMemberRequest,
    EventCreateRequest,
    EventResponse,
)


router = APIRouter()


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    request: EventCreateRequest,
    current_user: User = Depends(require_role("admin")),
) -> EventResponse:
    """Admin creates a new event. Only admins can create events."""
    new_event = Event(
        name=request.name,
        description=request.description,
        admin_id=current_user.id,
        team_member_ids=[],
    )
    await new_event.insert()
    return EventResponse.model_validate(new_event)


@router.post("/{event_id}/team-members", response_model=EventResponse)
async def add_team_member(
    event_id: PydanticObjectId,
    request: AddTeamMemberRequest,
    current_user: User = Depends(require_role("admin")),
) -> EventResponse:
    """Admin adds an existing team-member-role user to an event by email. Only the event's own admin can do this."""
    event = await Event.get(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.admin_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own events",
        )

    member_user = await User.find_one(User.email == request.email)
    if member_user is None:
        raise HTTPException(
            status_code=404,
            detail="No user found with this email",
        )

    if member_user.role != "team_member":
        raise HTTPException(
            status_code=400,
            detail="This user is not a team member",
        )

    if member_user.id in event.team_member_ids:
        raise HTTPException(
            status_code=409,
            detail="This user is already a team member of this event",
        )

    event.team_member_ids.append(member_user.id)
    member_user.event_ids.append(event.id)
    await event.save()
    await member_user.save()
    return EventResponse.model_validate(event)


@router.get("", response_model=List[EventResponse])
async def list_events(
    current_user: User = Depends(get_current_user),
) -> List[EventResponse]:
    """List events the current user belongs to. Admins see events they created; team members see events they're assigned to."""
    if current_user.role == "admin":
        events = await Event.find(Event.admin_id == current_user.id).to_list()
    else:
        events = await Event.find(In(Event.id, current_user.event_ids)).to_list()

    return [EventResponse.model_validate(event) for event in events]


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
) -> EventDetailResponse:
    """Get a single event by id, but only if the current user is the event's admin
    or an assigned team member. Returns admin and team members as full objects so
    the client can render names rather than raw ids."""
    event = await Event.get(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    is_admin_owner = (
        current_user.role == "admin" and event.admin_id == current_user.id
    )
    is_team_member = current_user.id in event.team_member_ids
    if not is_admin_owner and not is_team_member:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this event",
        )

    people = await User.find(
        In(User.id, [event.admin_id, *event.team_member_ids])
    ).to_list()
    by_id = {u.id: u for u in people}

    return EventDetailResponse(
        **EventResponse.model_validate(event).model_dump(),
        admin=UserSummary.model_validate(by_id[event.admin_id]),
        team_members=[
            UserSummary.model_validate(by_id[uid])
            for uid in event.team_member_ids
            if uid in by_id
        ],
    )


@router.delete("/{event_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    event_id: PydanticObjectId,
    user_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a team member from an event. Only the event's admin may do this.
    Photos the member already uploaded stay with the event."""
    event = await Event.get(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    is_admin_owner = (
        current_user.role == "admin" and event.admin_id == current_user.id
    )
    if not is_admin_owner:
        raise HTTPException(
            status_code=403,
            detail="Only the event admin can remove team members",
        )

    if user_id == event.admin_id:
        raise HTTPException(
            status_code=400,
            detail="The event admin cannot be removed",
        )
    if user_id not in event.team_member_ids:
        raise HTTPException(
            status_code=404,
            detail="This user is not a member of the event",
        )

    event.team_member_ids.remove(user_id)
    await event.save()