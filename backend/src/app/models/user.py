from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    email: Optional[str] = Field(default=None, index=True)
    name: Optional[str] = None


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    auth0_sub: str = Field(unique=True, index=True)  # Auth0 subject ID
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    auth0_sub: str
    created_at: datetime
