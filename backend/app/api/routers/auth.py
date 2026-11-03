from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.db.mongo import get_database
from app.schemas.auth import AuthResponse, LoginRequest, SignUpRequest
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    request: SignUpRequest,
    database: Database = Depends(get_database),
) -> dict[str, object]:
    return register_user(database, request)


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    database: Database = Depends(get_database),
) -> dict[str, object]:
    return authenticate_user(database, request.email, request.password)
