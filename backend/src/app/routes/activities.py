from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..db import get_session
from ..dependencies import CurrentUser
from ..models import (
    Activity,
    ActivityCreate,
    ActivityProgress,
    ActivityProgressRead,
    ActivityProgressUpdate,
    ActivityRead,
    ActivityStatus,
)

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("", response_model=list[ActivityRead])
async def list_activities(session: AsyncSession = Depends(get_session)):
    """List all available activities."""
    result = await session.execute(select(Activity))
    return result.scalars().all()


@router.get("/{activity_id}", response_model=ActivityRead)
async def get_activity(activity_id: int, session: AsyncSession = Depends(get_session)):
    """Get an activity by ID."""
    activity = await session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.post("", response_model=ActivityRead, status_code=201)
async def create_activity(
    activity: ActivityCreate, session: AsyncSession = Depends(get_session)
):
    """Create a new activity definition."""
    db_activity = Activity.model_validate(activity)
    session.add(db_activity)
    await session.commit()
    await session.refresh(db_activity)
    return db_activity


@router.get("/progress/me", response_model=list[ActivityProgressRead])
async def list_my_progress(
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """List all activity progress for the current user."""
    result = await session.execute(
        select(ActivityProgress).where(ActivityProgress.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{activity_id}/progress", response_model=ActivityProgressRead)
async def get_my_progress(
    activity_id: int,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Get current user's progress for a specific activity."""
    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == current_user.id,
            ActivityProgress.activity_id == activity_id,
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(
            status_code=404, detail="No progress found for this activity"
        )
    return progress


@router.post(
    "/{activity_id}/progress", response_model=ActivityProgressRead, status_code=201
)
async def start_activity(
    activity_id: int,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Start an activity - creates a new progress record."""

    activity = await session.get(Activity, activity_id)

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == current_user.id,
            ActivityProgress.activity_id == activity_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409, detail="Progress already exists. Use PUT to update."
        )

    assert current_user.id is not None

    progress = ActivityProgress(
        user_id=current_user.id,
        activity_id=activity_id,
        status=ActivityStatus.in_progress,
        started_at=datetime.utcnow(),
    )

    session.add(progress)

    await session.commit()
    await session.refresh(progress)

    return progress


@router.put("/{activity_id}/progress", response_model=ActivityProgressRead)
async def update_progress(
    activity_id: int,
    update: ActivityProgressUpdate,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Update progress for an activity."""
    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == current_user.id,
            ActivityProgress.activity_id == activity_id,
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=404, detail="No progress found. Start the activity first."
        )

    if update.correct_questions is not None:
        progress.correct_questions = update.correct_questions
    if update.total_questions is not None:
        progress.total_questions = update.total_questions
    if update.mastered_units is not None:
        progress.mastered_units = update.mastered_units
    if update.xp_earned is not None:
        progress.xp_earned = update.xp_earned
    if update.elapsed_ms is not None:
        progress.elapsed_ms = update.elapsed_ms

    if update.status is not None:
        progress.status = update.status
        if update.status == ActivityStatus.completed and progress.completed_at is None:
            progress.completed_at = datetime.utcnow()

    progress.updated_at = datetime.utcnow()

    await session.commit()
    await session.refresh(progress)

    return progress


@router.delete("/{activity_id}/progress", status_code=204)
async def reset_progress(
    activity_id: int,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Reset/delete progress for an activity (start over)."""

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == current_user.id,
            ActivityProgress.activity_id == activity_id,
        )
    )

    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")

    await session.delete(progress)
    await session.commit()
