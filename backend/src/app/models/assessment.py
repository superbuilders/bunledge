from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .exercise import Exercise
    from .user import User


class AssessmentBase(SQLModel):
    score: float = Field(ge=0, le=100)
    feedback: Optional[str] = None


class Assessment(AssessmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user_id: int = Field(foreign_key="user.id")
    exercise_id: int = Field(foreign_key="exercise.id")

    user: "User" = Relationship(back_populates="assessments")
    exercise: "Exercise" = Relationship(back_populates="assessments")


class AssessmentCreate(AssessmentBase):
    user_id: int
    exercise_id: int


class AssessmentRead(AssessmentBase):
    id: int
    created_at: datetime
    user_id: int
    exercise_id: int
