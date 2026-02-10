from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import verify_token
from .config import get_settings
from .db import get_session
from .models import User

security = HTTPBearer()


async def fetch_userinfo(token: str) -> dict[str, Any]:
    """Fetch user info from Auth0's /userinfo endpoint."""
    settings = get_settings()
    userinfo_url = f"https://{settings.auth0_domain}/userinfo"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            return {}
        return response.json()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """
    Dependency that validates the JWT token and returns the current user.
    Creates a new user record on first login.
    """
    token = credentials.credentials
    payload = verify_token(token)

    auth0_sub = payload.get("sub")

    if not auth0_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    result = await session.execute(select(User).where(User.auth0_sub == auth0_sub))
    user = result.scalar_one_or_none()

    if not user:
        userinfo = await fetch_userinfo(token)

        user = User(
            auth0_sub=auth0_sub,
            email=userinfo.get("email"),
            name=userinfo.get("name") or userinfo.get("nickname"),
        )
        session.add(user)
        try:
            await session.commit()
            await session.refresh(user)
        except IntegrityError:
            # Another concurrent request already created this user — re-query
            await session.rollback()
            result = await session.execute(
                select(User).where(User.auth0_sub == auth0_sub)
            )
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create or retrieve user",
                )

    return user


# Type alias for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
