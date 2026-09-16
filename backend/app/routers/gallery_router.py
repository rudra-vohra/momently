from datetime import timedelta
from typing import List

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies.auth_deps import get_current_user, verify_gallery_token
from app.models.event import Event
from app.models.gallery import Gallery
from app.models.photo import Photo
from app.models.user import User
from app.schemas.gallery_schema import (
    GalleryAccessRequest,
    GalleryArchiveResponse,
    GalleryPublishRequest,
    GalleryResponse,
    PublicGalleryInfo,
    PublicGalleryResponse,
    PublicPhoto,
)
from app.utils.rate_limit import (
    check_pin_attempts,
    clear_attempts,
    clear_attempts_for_slug,
    record_failure,
)
from app.utils.slug import generate_unique_slug
from app.utils.storage import build_archive_url, build_download_url

router = APIRouter(prefix="/galleries", tags=["galleries"])


# ---------- Helpers ----------

async def get_event_as_admin(event_id: PydanticObjectId, user: User) -> Event:
    """Fetch an event, ensuring the current user is its admin."""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    if event.admin_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only the event admin can manage the gallery"
        )
    return event


async def get_published_gallery(slug: str) -> Gallery:
    """Fetch a gallery by slug, 404ing if it is missing or unpublished."""
    gallery = await Gallery.find_one(Gallery.slug == slug)
    if not gallery or not gallery.is_published:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Gallery not found")
    return gallery


def _to_response(gallery: Gallery) -> GalleryResponse:
    return GalleryResponse(
        id=gallery.id,
        event_id=gallery.event_id,
        slug=gallery.slug,
        is_published=gallery.is_published,
        photo_count=len(gallery.published_photo_ids),
        created_at=gallery.created_at,
    )


# ---------- Admin routes ----------

@router.post("/events/{event_id}/publish", response_model=GalleryResponse)
async def publish_gallery(
    event_id: PydanticObjectId,
    payload: GalleryPublishRequest,
    current_user: User = Depends(get_current_user),
):
    """Create or refresh the public gallery snapshot for an event."""
    event = await get_event_as_admin(event_id, current_user)

    selected = await Photo.find(
        Photo.event_id == event_id,
        Photo.selected_for_gallery == True,  # noqa: E712
    ).to_list()
    if not selected:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "No photos selected for this gallery"
        )

    gallery = await Gallery.find_one(Gallery.event_id == event_id)

    if gallery is None:
        if not payload.pin:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "A PIN is required to publish a new gallery",
            )
        gallery = Gallery(
            event_id=event_id,
            slug=await generate_unique_slug(event.name),
            pin_hash=hash_password(payload.pin),
        )
    elif payload.pin:
        gallery.pin_hash = hash_password(payload.pin)

    gallery.published_photo_ids = [p.id for p in selected]
    gallery.is_published = True
    await gallery.save()

    # A rotated PIN should not inherit an old lockout.
    clear_attempts_for_slug(gallery.slug)

    return _to_response(gallery)


@router.get("/events/{event_id}", response_model=GalleryResponse)
async def get_gallery(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Admin view of the gallery's current state."""
    await get_event_as_admin(event_id, current_user)
    gallery = await Gallery.find_one(Gallery.event_id == event_id)
    if not gallery:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No gallery for this event yet")
    return _to_response(gallery)


@router.patch("/events/{event_id}/unpublish", response_model=GalleryResponse)
async def unpublish_gallery(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Hide the gallery from the public without destroying the slug or snapshot."""
    await get_event_as_admin(event_id, current_user)
    gallery = await Gallery.find_one(Gallery.event_id == event_id)
    if not gallery:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No gallery for this event yet")
    gallery.is_published = False
    await gallery.save()
    return _to_response(gallery)


# ---------- Public routes (no authentication) ----------

@router.get("/public/{slug}", response_model=PublicGalleryInfo)
async def public_gallery_info(slug: str):
    """Landing info shown before the PIN is entered. Never returns photos."""
    gallery = await get_published_gallery(slug)
    event = await Event.get(gallery.event_id)
    return PublicGalleryInfo(
        slug=gallery.slug,
        event_name=event.name if event else "Event",
        photo_count=len(gallery.published_photo_ids),
    )


@router.post("/public/{slug}/access", response_model=PublicGalleryResponse)
async def access_gallery(
    slug: str,
    payload: GalleryAccessRequest,
    request: Request,
):
    """Exchange a correct PIN for the published photos and a 24h access token."""
    attempt_key = check_pin_attempts(request, slug)  # before any bcrypt work

    gallery = await get_published_gallery(slug)

    if not verify_password(payload.pin, gallery.pin_hash):
        record_failure(attempt_key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect PIN")

    clear_attempts(attempt_key)

    photos = await Photo.find(In(Photo.id, gallery.published_photo_ids)).to_list()
    event = await Event.get(gallery.event_id)

    token = create_access_token(
        {"sub": gallery.slug, "scope": "gallery"},
        expires_delta=timedelta(hours=24),
    )

    return PublicGalleryResponse(
        slug=gallery.slug,
        event_name=event.name if event else "Event",
        photos=[
            PublicPhoto(
                id=p.id,
                url=p.url,
                thumbnail_url=p.thumbnail_url,
                filename=p.filename,
                download_url=build_download_url(p.storage_key, p.filename)
            )
            for p in photos
        ],
        access_token=token,
    )

@router.get("/public/{slug}/download-all", response_model=GalleryArchiveResponse)
async def download_all(slug: str, _: str = Depends(verify_gallery_token)):
    """Signed Cloudinary zip URL for every published photo. Requires a gallery token."""
    gallery = await get_published_gallery(slug)
    photos = await Photo.find(In(Photo.id, gallery.published_photo_ids)).to_list()
    if not photos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No photos to download")

    return GalleryArchiveResponse(
        download_url=build_archive_url([p.storage_key for p in photos], slug),
        photo_count=len(photos),
    )