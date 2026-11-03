from pydantic import BaseModel, Field


class SaveUrlRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class SavedUrlResponse(BaseModel):
    id: str
    url: str
    preview_url: str
    preview_title: str
    created_at: str
