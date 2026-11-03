from functools import lru_cache

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.core.config import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    return MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)


def get_database() -> Database:
    return get_mongo_client()[settings.mongo_database]


def initialize_database() -> None:
    database = get_database()
    database.command("ping")
    database.users.create_index([("email", ASCENDING)], unique=True)
    database.saved_urls.create_index(
        [("user_id", ASCENDING), ("created_at", DESCENDING)]
    )


def close_mongo_client() -> None:
    if get_mongo_client.cache_info().currsize:
        get_mongo_client().close()
        get_mongo_client.cache_clear()
