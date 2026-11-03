import os
import secrets


class Settings:
    app_secret_key = os.getenv("APP_SECRET_KEY") or secrets.token_urlsafe(32)
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongo_database = os.getenv("MONGODB_DATABASE", "siteshelf")
    frontend_origins = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173, http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
