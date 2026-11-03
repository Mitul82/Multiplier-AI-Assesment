from typing import Any

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError
from pymongo.database import Database

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import create_user, find_user_by_email
from app.schemas.auth import SignUpRequest


def serialize_user(user: dict[str, Any]) -> dict[str, str]:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }


def create_auth_response(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "access_token": create_access_token(str(user["_id"]), settings.app_secret_key),
        "token_type": "bearer",
        "user": serialize_user(user),
    }


def register_user(database: Database, request: SignUpRequest) -> dict[str, Any]:
    password_hash, password_salt = hash_password(request.password)
    user = {
        "name": request.name,
        "email": request.email,
        "password_hash": password_hash,
        "password_salt": password_salt,
    }

    try:
        created_user = create_user(database, user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return create_auth_response(created_user)


def authenticate_user(
    database: Database,
    email: str,
    password: str,
) -> dict[str, Any]:
    user = find_user_by_email(database, email)
    if user is None or not verify_password(
        password,
        user["password_hash"],
        user["password_salt"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return create_auth_response(user)
