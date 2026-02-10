"""
Timeback SDK Integration

Integrates Timeback with custom auth (using existing Auth0 authentication).
"""

from fastapi import Request
from sqlmodel import select
from timeback import ApiCredentials, CustomIdentityConfig, TimebackConfig
from timeback.server.adapters.fastapi import TimebackFastAPI

from .auth import verify_token
from .config import get_settings
from .db import async_session
from .models import User


async def _resolve_email(request: Request) -> str | None:
    """Resolve user email from JWT → local DB. Used by Timeback custom auth."""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        payload = verify_token(token)
        auth0_sub = payload.get("sub")

        if not auth0_sub:
            return None

        async with async_session() as session:
            result = await session.execute(
                select(User.email).where(User.auth0_sub == auth0_sub)
            )
            return result.scalar_one_or_none()

    except Exception:
        return None


settings = get_settings()

timeback = TimebackFastAPI(
    TimebackConfig(
        env=settings.timeback_env,
        config_path="../timeback.config.json",
        api=ApiCredentials(
            client_id=settings.timeback_api_client_id,
            client_secret=settings.timeback_api_client_secret,
        ),
        identity=CustomIdentityConfig(
            mode="custom",
            get_email=_resolve_email,
        ),
    )
)
