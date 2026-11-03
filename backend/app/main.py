from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, urls
from app.core.config import settings
from app.db.mongo import close_mongo_client, get_database, initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield
    close_mongo_client()


app = FastAPI(title="SiteShelf API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(urls.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    get_database().command("ping")
    return {"status": "ok"}
