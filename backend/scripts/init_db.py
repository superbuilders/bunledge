#!/usr/bin/env python3
"""
Initialize database tables.

Run this before starting the API server to ensure tables exist.
"""

import asyncio

from src.app.db import init_db
from src.app.models import User  # noqa: F401 - import to register model


async def main():
    print("Creating database tables...")
    await init_db()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
