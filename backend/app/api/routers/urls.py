from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.api.dependencies import current_user_id
from app.db.mongo import get_database
from app.schemas.url import SaveUrlRequest, SavedUrlResponse
from app.services.url_service import get_user_urls, save_user_url

router = APIRouter(prefix="/urls", tags=["saved websites"])


@router.get("", response_model=list[SavedUrlResponse])
def list_urls(
    user_id: str = Depends(current_user_id),
    database: Database = Depends(get_database),
) -> list[dict[str, str]]:
    return get_user_urls(database, user_id)


@router.post(
    "",
    response_model=SavedUrlResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_url(
    request: SaveUrlRequest,
    user_id: str = Depends(current_user_id),
    database: Database = Depends(get_database),
) -> dict[str, str]:
    return save_user_url(database, user_id, request.url)
