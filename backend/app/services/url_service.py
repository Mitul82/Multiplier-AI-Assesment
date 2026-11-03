import ipaddress
import string
from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4

from fastapi import HTTPException
from pymongo.database import Database

from app.repositories.url_repository import create_saved_url, list_urls_for_user


def normalize_url(value: str) -> tuple[str, str]:
    value = value.strip()
    if not value:
        raise HTTPException(status_code=422, detail="Enter a valid website URL.")

    candidate = value if "://" in value else f"https://{value}"
    try:
        parsed = urlsplit(candidate)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Enter a valid public website URL using http or https.",
        ) from None

    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or any(character in value for character in string.whitespace)
    ):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid public website URL using http or https.",
        )

    host = hostname.lower()
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None and not address.is_global:
        raise HTTPException(status_code=422, detail="Local network URLs cannot be saved.")
    if host == "localhost" or host.endswith((".localhost", ".local")):
        raise HTTPException(status_code=422, detail="Local network URLs cannot be saved.")

    netloc = f"[{host}]" if ":" in host else host
    if port is not None:
        netloc = f"{netloc}:{port}"
    normalized = urlunsplit(
        (
            parsed.scheme.lower(),
            netloc,
            parsed.path or "/",
            parsed.query,
            parsed.fragment,
        )
    )
    return normalized, host.removeprefix("www.")


def serialize_saved_url(saved_url: dict[str, object]) -> dict[str, str]:
    return {
        "id": str(saved_url["_id"]),
        "url": str(saved_url["url"]),
        "preview_url": str(saved_url["preview_url"]),
        "preview_title": str(saved_url["preview_title"]),
        "created_at": str(saved_url["created_at"]),
    }


def get_user_urls(database: Database, user_id: str) -> list[dict[str, str]]:
    return [serialize_saved_url(item) for item in list_urls_for_user(database, user_id)]


def save_user_url(
    database: Database,
    user_id: str,
    value: str,
) -> dict[str, str]:
    url, preview_title = normalize_url(value)
    saved_url = create_saved_url(
        database,
        {
            "user_id": user_id,
            "url": url,
            "preview_url": url,
            "preview_title": preview_title,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return serialize_saved_url(saved_url)
