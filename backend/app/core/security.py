import base64
import binascii
import hashlib
import hmac
import json
import secrets
import time

from fastapi import HTTPException, status

TOKEN_LIFETIME_SECONDS = 60 * 60 * 24
PASSWORD_ITERATIONS = 310_000


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt,
        PASSWORD_ITERATIONS,
    )
    return password_hash.hex(), password_salt.hex()


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    candidate_hash, _ = hash_password(password, bytes.fromhex(password_salt))
    return hmac.compare_digest(candidate_hash, password_hash)


def create_access_token(user_id: str, secret_key: str) -> str:
    payload = json.dumps(
        {"sub": user_id, "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(
        secret_key.encode("utf-8"),
        encoded_payload,
        hashlib.sha256,
    )
    encoded_signature = base64.urlsafe_b64encode(signature.digest()).rstrip(b"=")
    return f"{encoded_payload.decode('ascii')}.{encoded_signature.decode('ascii')}"


def decode_access_token(token: str, secret_key: str) -> str:
    try:
        encoded_payload, encoded_signature = token.split(".", maxsplit=1)
        expected_signature = hmac.new(
            secret_key.encode("utf-8"),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
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
    except (
        ValueError,
        TypeError,
        UnicodeDecodeError,
        binascii.Error,
        json.JSONDecodeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
