from datetime import datetime
from typing import Literal

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, EmailStr


class UserRegisterRequest(BaseModel):
	"""Request body for registering a new user."""

	name: str
	email: EmailStr
	password: str
	role: Literal["admin", "team_member"]


class UserLoginRequest(BaseModel):
	"""Request body for logging in an existing user."""

	email: EmailStr
	password: str


class UserResponse(BaseModel):
	"""Public user information returned by the API."""

	id: PydanticObjectId
	name: str
	email: EmailStr
	role: Literal["admin", "team_member"]
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
	"""Access token returned after successful authentication."""

	access_token: str
	token_type: str = "bearer"

class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: PydanticObjectId
    name: str
    email: EmailStr
    role: str