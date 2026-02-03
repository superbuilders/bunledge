from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
