from typing import Any

from bson import ObjectId
from pymongo.database import Database


def find_user_by_email(database: Database, email: str) -> dict[str, Any] | None:
    return database.users.find_one({"email": email})


def find_user_by_id(database: Database, user_id: str) -> dict[str, Any] | None:
    if not ObjectId.is_valid(user_id):
        return None
    return database.users.find_one({"_id": ObjectId(user_id)})


def create_user(database: Database, user: dict[str, Any]) -> dict[str, Any]:
    result = database.users.insert_one(user)
    created_user = database.users.find_one({"_id": result.inserted_id})
    if created_user is None:
        raise RuntimeError("The created account could not be retrieved.")
    return created_user
