from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from timeback import Environment


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Auth0
    auth0_domain: str = ""
    auth0_audience: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://bunledge:bunledge@localhost:5433/bunledge"

    # Timeback
    timeback_env: Environment = "staging"

    # Defaults are empty strings so the app can start without a .env file
    # (e.g. in CI or for frontend-only work). Pydantic populates these from
    # environment variables or the .env file at runtime via SettingsConfigDict.
    timeback_api_client_id: str = ""
    timeback_api_client_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
