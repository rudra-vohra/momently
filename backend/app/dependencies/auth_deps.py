from fastapi import Header, HTTPException, status
from jose import JWTError, jwt
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from beanie import PydanticObjectId

from app.core.security import decode_access_token
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
	"""Resolve the authenticated user for routes using Depends(get_current_user)."""
	payload = decode_access_token(token)
	if payload is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid or expired authentication token",
			headers={"WWW-Authenticate": "Bearer"},
		)

	user_id = payload.get("sub")
	try:
		user = await User.get(PydanticObjectId(user_id))
	except Exception:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid or expired authentication token",
			headers={"WWW-Authenticate": "Bearer"},
		)

	if user is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found",
		)

	return user




async def verify_gallery_token(slug: str, authorization: str = Header(...)) -> str:
    """Confirm the caller holds a valid gallery token for this specific slug."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing gallery token")
    token = authorization.removeprefix("Bearer ")
    try:
       payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired gallery token")

    if payload.get("scope") != "gallery" or payload.get("sub") != slug:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Token is not valid for this gallery")
    return slug


def require_role(required_role: str):
	"""Create a role dependency for routes using Depends(require_role('admin'))."""

	async def role_checker(
		current_user: User = Depends(get_current_user),
	) -> User:
		if current_user.role != required_role:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail=f"This action requires '{required_role}' role",
			)
		return current_user

	return role_checker
