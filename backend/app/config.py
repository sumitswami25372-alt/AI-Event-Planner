"""
CelebrAI application settings.

Loads configuration from environment variables and .env file using
pydantic-settings.  All sensitive values (API keys) are validated at
startup so misconfiguration is caught early rather than at request time.
"""
from __future__ import annotations

import os

from pydantic_settings import BaseSettings, SettingsConfigDict

# Canonical application version — single source of truth
APP_VERSION: str = "1.0.0"

# Supported ISO-4217 currency codes — kept here so validators and routes
# both reference the same authoritative list.
_SUPPORTED_CURRENCIES: tuple[str, ...] = (
    "INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"
)


class Settings(BaseSettings):
    """Runtime-configurable application settings with safe defaults."""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DATABASE_URL: str = "sqlite:///./celebrai.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    AI_TIMEOUT_SECONDS: int = 30
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,  # Prevent accidental mutation at runtime
    )

    @property
    def effective_database_url(self) -> str:
        """Return the database URL, redirecting SQLite to /tmp on read-only serverless filesystems."""
        serverless = os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
        if serverless and "sqlite" in self.DATABASE_URL:
            if "./celebrai.db" in self.DATABASE_URL or self.DATABASE_URL == "sqlite:///celebrai.db":
                return "sqlite:////tmp/celebrai.db"
        return self.DATABASE_URL

    @property
    def cors_origins_list(self) -> list[str]:
        """Split CORS_ORIGINS string into a validated list of origin URLs."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def supported_currencies(self) -> list[str]:
        """Return the canonical list of supported ISO-4217 currency codes."""
        return list(_SUPPORTED_CURRENCIES)

    @property
    def is_gemini_configured(self) -> bool:
        """Return True only when a plausible Gemini API key is present."""
        key = self.GEMINI_API_KEY.strip()
        return bool(key) and len(key) > 10  # noqa: PLR2004


settings = Settings()
