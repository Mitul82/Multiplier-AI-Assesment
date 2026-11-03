from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import string
import time
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator
from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

DATABASE_PATH = Path(
    os.getenv("DATABASE_PATH", str(Path(__file__).with_name("data") / "siteshelf.db"))
)
TOKEN_SECRET = os.getenv("APP_SECRET_KEY") or secrets.token_urlsafe(32)
TOKEN_LIFETIME_SECONDS = 60 * 60 * 24
PASSWORD_ITERATIONS = 310_000
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
bearer_scheme = HTTPBearer(auto_error=False)


@contextmanager
def database() -> Iterator[sqlite3.Connection]:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database() -> None:
    with database() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS saved_urls (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                preview_url TEXT NOT NULL,
                preview_title TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS saved_urls_user_created
                ON saved_urls(user_id, created_at DESC);
            """
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="SiteShelf API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class SignUpRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address.")
        return value


class SaveUrlRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), password_salt, PASSWORD_ITERATIONS
    )
    return password_hash.hex(), password_salt.hex()


def create_access_token(user_id: str) -> str:
    payload = json.dumps(
        {"sub": user_id, "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(TOKEN_SECRET.encode("utf-8"), encoded_payload, hashlib.sha256)
    encoded_signature = base64.urlsafe_b64encode(signature.digest()).rstrip(b"=")
    return f"{encoded_payload.decode('ascii')}.{encoded_signature.decode('ascii')}"


def decode_access_token(token: str) -> str:
    try:
        encoded_payload, encoded_signature = token.split(".", maxsplit=1)
        expected_signature = hmac.new(
            TOKEN_SECRET.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        supplied_signature = base64.urlsafe_b64decode(
            encoded_signature + "=" * (-len(encoded_signature) % 4)
        )
        if not hmac.compare_digest(expected_signature, supplied_signature):
            raise ValueError("Invalid signature")
        payload_bytes = base64.urlsafe_b64decode(
            encoded_payload + "=" * (-len(encoded_payload) % 4)
        )
        payload = json.loads(payload_bytes)
        if not isinstance(payload, dict) or not isinstance(payload.get("sub"), str):
            raise ValueError("Invalid token payload")
        if not isinstance(payload.get("exp"), int) or payload["exp"] <= time.time():
            raise ValueError("Expired token")
        return payload["sub"]
    except (ValueError, TypeError, UnicodeDecodeError, binascii.Error, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


def current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)


def user_payload(row: sqlite3.Row) -> dict[str, str]:
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


def auth_response(row: sqlite3.Row) -> dict[str, object]:
    return {
        "access_token": create_access_token(row["id"]),
        "token_type": "bearer",
        "user": user_payload(row),
    }


def normalize_url(value: str) -> tuple[str, str]:
    value = value.strip()
    if not value:
        raise HTTPException(status_code=422, detail="Enter a valid website URL.")

    candidate = value if "://" in value else f"https://{value}"
    try:
        parsed = urlsplit(candidate)
        hostname = parsed.hostname
        valid_port = parsed.port
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
        raise HTTPException(
            status_code=422,
            detail="Local network URLs cannot be saved.",
        )
    if host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        raise HTTPException(
            status_code=422,
            detail="Local network URLs cannot be saved.",
        )

    netloc = host
    if valid_port is not None:
        netloc = f"{host}:{valid_port}"
    if ":" in host and not host.startswith("["):
        netloc = f"[{host}]" + (f":{valid_port}" if valid_port is not None else "")
    normalized = urlunsplit(
        (parsed.scheme.lower(), netloc, parsed.path or "/", parsed.query, parsed.fragment)
    )
    return normalized, host.removeprefix("www.")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(request: SignUpRequest) -> dict[str, object]:
    user_id = str(uuid4())
    password_hash, password_salt = hash_password(request.password)
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with database() as connection:
            connection.execute(
                """
                INSERT INTO users (id, name, email, password_hash, password_salt, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    request.name,
                    request.email,
                    password_hash,
                    password_salt,
                    created_at,
                ),
            )
            row = connection.execute(
                "SELECT id, name, email FROM users WHERE id = ?", (user_id,)
            ).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return auth_response(row)


@app.post("/api/auth/login")
def login(request: LoginRequest) -> dict[str, object]:
    with database() as connection:
        row = connection.execute(
            "SELECT id, name, email, password_hash, password_salt FROM users WHERE email = ?",
            (request.email,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    candidate_hash, _ = hash_password(request.password, bytes.fromhex(row["password_salt"]))
    if not hmac.compare_digest(candidate_hash, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return auth_response(row)


@app.get("/api/urls")
def list_urls(user_id: str = Depends(current_user_id)) -> list[dict[str, str]]:
    with database() as connection:
        rows = connection.execute(
            """
            SELECT id, url, preview_url, preview_title, created_at
            FROM saved_urls
            WHERE user_id = ?
            ORDER BY created_at DESC, rowid DESC
            """,
            (user_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/urls", status_code=status.HTTP_201_CREATED)
def create_url(
    request: SaveUrlRequest,
    user_id: str = Depends(current_user_id),
) -> dict[str, str]:
    url, preview_title = normalize_url(request.url)
    record = {
        "id": str(uuid4()),
        "url": url,
        "preview_url": url,
        "preview_title": preview_title,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with database() as connection:
        connection.execute(
            """
            INSERT INTO saved_urls (id, user_id, url, preview_url, preview_title, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                user_id,
                record["url"],
                record["preview_url"],
                record["preview_title"],
                record["created_at"],
            ),
        )

    return record
