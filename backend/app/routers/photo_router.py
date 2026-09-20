import asyncio
from typing import List

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.dependencies.auth_deps import get_current_user
from app.models.event import Event
from app.models.gallery import Gallery
from app.models.photo import Photo
from app.models.user import User
from app.schemas.photo_schema import (
    PhotoResponse,
    PhotoUploadResponse,
    SelectPhotosRequest,
    SelectionUpdateRequest,
    SelectionUpdateResponse
)
from app.utils.storage import (
    ALLOWED_CONTENT_TYPES,
    build_thumbnail_url,
    delete_photo_from_cloudinary,
    upload_photo_to_cloudinary,
)

router = APIRouter(prefix="/photos", tags=["photos"])


async def get_event_for_member(event_id: PydanticObjectId, user: User) -> Event:
    """Fetch an event, ensuring the user is its admin or an assigned team member."""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    if event.admin_id != user.id and user.id not in event.team_member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this event")
    return event


async def get_locked_published_photo_ids(
    event_id: PydanticObjectId,
    photo_ids: list[PydanticObjectId],
) -> set[PydanticObjectId]:
    """Return requested photo IDs locked by the event's published snapshot."""
    gallery = await Gallery.find_one(Gallery.event_id == event_id)
    if gallery is None or not gallery.is_published:
        return set()
    return set(photo_ids).intersection(gallery.published_photo_ids)


@router.post("/{event_id}", response_model=PhotoUploadResponse,
             status_code=status.HTTP_201_CREATED)
async def upload_photos(
    event_id: PydanticObjectId,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    event = await get_event_for_member(event_id, current_user)

    valid, failed = [], []
    for f in files:
        if f.content_type in ALLOWED_CONTENT_TYPES:
            valid.append(f)
        else:
            failed.append(f"{f.filename}: unsupported type {f.content_type}")

    if not valid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No valid image files")

    results = await asyncio.gather(
        *[upload_photo_to_cloudinary(f, str(event_id)) for f in valid],
        return_exceptions=True,
    )

    photos = []
    for f, result in zip(valid, results):
        if isinstance(result, Exception):
            failed.append(f"{f.filename}: upload failed")
            continue
        photos.append(Photo(
            event_id=event_id,
            uploaded_by=current_user.id,
            filename=f.filename,
            url=result["url"],
            thumbnail_url=build_thumbnail_url(result["storage_key"]),
            storage_key=result["storage_key"],
            file_size=result["file_size"],
        ))

    if photos:
        insert_result = await Photo.insert_many(photos)
        for photo, inserted_id in zip(photos, insert_result.inserted_ids):
            photo.id = inserted_id
        
        if event.cover_image_url is None:
            event.cover_image_url = photos[0].thumbnail_url
            await event.save()

    return PhotoUploadResponse(uploaded=photos, failed=failed)


@router.get("/{event_id}", response_model=List[PhotoResponse])
async def list_photos(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    await get_event_for_member(event_id, current_user)
    return await Photo.find(Photo.event_id == event_id).sort("-created_at").to_list()


@router.patch("/{event_id}/select", response_model=dict)
async def select_photos(
    event_id: PydanticObjectId,
    payload: SelectPhotosRequest,
    current_user: User = Depends(get_current_user),
):
    event = await get_event_for_member(event_id, current_user)
    if event.admin_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event admin can select photos")

    locked_photo_ids = await get_locked_published_photo_ids(
        event_id, payload.photo_ids
    )
    if locked_photo_ids:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot change selection of a photo that is part of the published gallery. Unpublish the gallery first.",
        )

    result = await Photo.find(
        Photo.event_id == event_id,
        In(Photo.id, payload.photo_ids),
    ).update({"$set": {Photo.selected_for_gallery: payload.selected}})

    return {"modified": result.modified_count, "selected": payload.selected}

@router.patch("/event/{event_id}/selection", response_model=SelectionUpdateResponse)
async def update_selection(
    event_id: PydanticObjectId,
    body: SelectionUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """Bulk select/deselect photos for an event's gallery draft."""
    event = await get_event_for_member(event_id, current_user)
    if event.admin_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event admin can select photos")

    requested_photo_ids = [*body.select, *body.deselect]
    locked_photo_ids = await get_locked_published_photo_ids(
        event_id, requested_photo_ids
    )
    if locked_photo_ids:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot change selection of a photo that is part of the published gallery. Unpublish the gallery first.",
        )

    updated = 0
    for ids, value in ((body.select, True), (body.deselect, False)):
        if not ids:
            continue
        result = await Photo.find(
            Photo.event_id == event.id,
            In(Photo.id, ids),
        ).update({"$set": {Photo.selected_for_gallery: value}})
        updated += result.modified_count

    selected_count = await Photo.find(
        Photo.event_id == event.id,
        Photo.selected_for_gallery == True,  # noqa: E712
    ).count()

    return SelectionUpdateResponse(selected_count=selected_count, updated=updated)

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    photo = await Photo.get(photo_id)
    if not photo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")

    event = await get_event_for_member(photo.event_id, current_user)
    if event.admin_id != current_user.id and photo.uploaded_by != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot delete this photo")

    locked_photo_ids = await get_locked_published_photo_ids(photo.event_id, [photo.id])
    if locked_photo_ids:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot delete a photo that is part of the published gallery. Unpublish the gallery first.",
        )

    await delete_photo_from_cloudinary(photo.storage_key)
    await photo.delete()

