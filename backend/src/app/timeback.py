"""
Timeback SDK Integration

Integrates Timeback with custom auth (using existing Auth0 authentication).
"""

from fastapi import Request
from sqlmodel import select
from timeback import ApiCredentials, CustomIdentityConfig, TimebackConfig
from timeback.server import create_server
from timeback.server.adapters.fastapi import to_fastapi_router

from .auth import verify_token
from .config import get_settings
from .db import async_session
from .models import User


async def get_user_email_from_request(request: Request) -> str | None:
    """
    Get user email from the local database (fast, no external API call).

    Flow:
    1. Extract Bearer token from Authorization header
    2. Verify the token and extract auth0_sub
    3. Look up user in local database by auth0_sub
    4. Return their email

    This is used by Timeback's custom auth mode to identify the current user.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        # Verify token and get claims
        payload = verify_token(token)
        auth0_sub = payload.get("sub")

        if not auth0_sub:
            return None

        # Look up user in local database
        async with async_session() as session:
            result = await session.execute(
                select(User.email).where(User.auth0_sub == auth0_sub)
            )
            email = result.scalar_one_or_none()
            return email

    except Exception:
        return None


async def create_timeback_router():
    """
    Create and configure the Timeback FastAPI router.

    Uses custom auth mode since we handle authentication via Auth0.
    """
    settings = get_settings()

    timeback = await create_server(
        TimebackConfig(
            env=settings.timeback_env,  # type: ignore[arg-type]
            config_path="../timeback.config.json",
            api=ApiCredentials(
                client_id=settings.timeback_api_client_id,
                client_secret=settings.timeback_api_client_secret,
            ),
            identity=CustomIdentityConfig(
                mode="custom",
                get_email=get_user_email_from_request,
            ),
        )
    )

    return to_fastapi_router(timeback)
