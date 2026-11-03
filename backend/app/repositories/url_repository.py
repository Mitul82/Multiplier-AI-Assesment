from typing import Any

from bson import ObjectId
from pymongo.database import Database


def list_urls_for_user(database: Database, user_id: str) -> list[dict[str, Any]]:
    return list(
        database.saved_urls.find({"user_id": ObjectId(user_id)})
        .sort([("created_at", -1), ("_id", -1)])
    )


def create_saved_url(database: Database, saved_url: dict[str, Any]) -> dict[str, Any]:
    document = {**saved_url, "user_id": ObjectId(str(saved_url["user_id"]))}
    result = database.saved_urls.insert_one(document)
    created_url = database.saved_urls.find_one({"_id": result.inserted_id})
    if created_url is None:
        raise RuntimeError("The saved website could not be retrieved.")
    return created_url
