from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies.auth_deps import get_current_user
from app.models.user import User
from app.schemas.user_schema import (
	TokenResponse,
	UserLoginRequest,
	UserRegisterRequest,
	UserResponse,
)


router = APIRouter()


@router.post(
	"/register",
	response_model=UserResponse,
	status_code=status.HTTP_201_CREATED,
)
async def register_user(request: UserRegisterRequest) -> UserResponse:
	"""Register a new user and return the public user response."""
	existing_user = await User.find_one(User.email == request.email)
	if existing_user is not None:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail="A user with this email already exists",
		)

	new_user = User(
		name=request.name,
		email=request.email,
		password_hash=hash_password(request.password),
		role=request.role,
	)
	await new_user.insert()
	return UserResponse.model_validate(new_user)


@router.post("/login", response_model=TokenResponse)
async def login_user(request: UserLoginRequest) -> TokenResponse:
	"""Authenticate a user and return a bearer access token."""
	user = await User.find_one(User.email == request.email)
	if user is None or not verify_password(request.password, user.password_hash):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid email or password",
		)

	token = create_access_token(data={"sub": str(user.id), "role": user.role})
	return TokenResponse(access_token=token, token_type="bearer")


# Temperory test route
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
	current_user: User = Depends(get_current_user),
) -> UserResponse:
	"""Temporary test route verifying JWT authentication and returning the current user's info."""
	return UserResponse.model_validate(current_user)
