from datetime import datetime
from typing import List
from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: PydanticObjectId
    event_id: PydanticObjectId
    uploaded_by: PydanticObjectId
    filename: str
    url: str
    thumbnail_url: str | None = None
    file_size: int
    selected_for_gallery: bool
    created_at: datetime


class PhotoUploadResponse(BaseModel):
    uploaded: List[PhotoResponse]
    failed: List[str] = []


class SelectPhotosRequest(BaseModel):
    photo_ids: List[PydanticObjectId]
    selected: bool = True

class SelectionUpdateRequest(BaseModel):
    select: List[PydanticObjectId] = []
    deselect: List[PydanticObjectId] = []


class SelectionUpdateResponse(BaseModel):
    selected_count: int
    updated: int