from datetime import datetime
from typing import List

from beanie import PydanticObjectId
from pydantic import BaseModel, Field


class GalleryPublishRequest(BaseModel):
    pin: str | None = Field(default=None, pattern=r"^\d{4}$")


class GalleryPinUpdateRequest(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")


class GalleryResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    slug: str
    is_published: bool
    photo_count: int
    created_at: datetime


class GalleryAccessRequest(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")


class PublicPhoto(BaseModel):
    id: PydanticObjectId
    url: str
    thumbnail_url: str | None = None
    filename: str
    download_url: str   

class PublicGalleryInfo(BaseModel):
    slug: str
    event_name: str
    photo_count: int


class PublicGalleryResponse(BaseModel):
    slug: str
    event_name: str
    photos: List[PublicPhoto]
    access_token: str

class GalleryArchiveResponse(BaseModel):
    download_url: str
    photo_count: int