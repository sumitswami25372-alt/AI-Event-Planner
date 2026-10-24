from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DATABASE_URL: str = "sqlite:///./celebrai.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    AI_TIMEOUT_SECONDS: int = 30
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def supported_currencies(self) -> List[str]:
        return ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"]

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 10)


settings = Settings()
