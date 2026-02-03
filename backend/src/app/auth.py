from functools import lru_cache
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status

from .config import get_settings

AUTH0_ALGORITHMS = ["RS256"]


class Auth0Error(Exception):
    """Auth0 authentication error."""

    pass


@lru_cache()
def get_jwks() -> dict[str, Any]:
    """Fetch and cache JWKS from Auth0."""
    settings = get_settings()
    if not settings.auth0_domain:
        raise Auth0Error("AUTH0_DOMAIN environment variable not set")

    jwks_url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
    response = httpx.get(jwks_url)
    response.raise_for_status()
    return response.json()


def get_signing_key(token: str) -> jwt.PyJWK:
    """Get the signing key for a token from JWKS."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.exceptions.DecodeError as e:
        raise Auth0Error(f"Invalid token header: {e}")

    jwks = get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            return jwt.PyJWK.from_dict(key)

    raise Auth0Error("Unable to find appropriate key in JWKS")


def verify_token(token: str) -> dict[str, Any]:
    """Verify and decode a JWT token from Auth0."""
    settings = get_settings()

    if not settings.auth0_domain:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH0_DOMAIN not configured",
        )

    if not settings.auth0_audience:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH0_AUDIENCE not configured",
        )

    try:
        signing_key = get_signing_key(token)

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=AUTH0_ALGORITHMS,
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )
    except Auth0Error as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
