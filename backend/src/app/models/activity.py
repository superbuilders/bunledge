from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ActivityStatus(str, Enum):
    """Status of a user's progress through an activity (matches frontend states)."""

    not_started = "not_started"  # idle
    in_progress = "in_progress"  # active
    paused = "paused"  # paused
    completed = "completed"  # submitted


# ---------------------------------------------------------------------------
# Activity - The "template" defining what an activity is
# ---------------------------------------------------------------------------


class ActivityBase(SQLModel):
    activity_id: str = Field(index=True)  # External activity identifier (from frontend)
    name: str
    course_code: str = Field(index=True)


class Activity(ActivityBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityCreate(ActivityBase):
    pass


class ActivityRead(ActivityBase):
    id: int
    created_at: datetime


# ---------------------------------------------------------------------------
# ActivityProgress - Tracks a user's stateful progress through an activity
# ---------------------------------------------------------------------------


class ActivityProgressBase(SQLModel):
    status: ActivityStatus = Field(default=ActivityStatus.not_started)
    # Metrics - matches frontend's ActivityMetrics
    correct_questions: int = Field(default=0)
    total_questions: int = Field(default=0)
    mastered_units: int = Field(default=0)
    xp_earned: Optional[int] = None
    # Time tracking
    elapsed_ms: int = Field(default=0)


class ActivityProgress(ActivityProgressBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    activity_id: int = Field(foreign_key="activity.id", index=True)
    started_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ActivityProgressCreate(SQLModel):
    """Used when starting an activity."""

    activity_id: int


class ActivityProgressUpdate(SQLModel):
    """Used when saving progress."""

    status: Optional[ActivityStatus] = None
    correct_questions: Optional[int] = None
    total_questions: Optional[int] = None
    mastered_units: Optional[int] = None
    xp_earned: Optional[int] = None
    elapsed_ms: Optional[int] = None


class ActivityProgressRead(ActivityProgressBase):
    id: int
    user_id: int
    activity_id: int
    started_at: Optional[datetime]
    updated_at: datetime
    completed_at: Optional[datetime]
