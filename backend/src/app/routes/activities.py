from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from timeback.server import TimebackInstance

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
from ..timeback import get_timeback

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
    user_id = current_user.id

    if user_id is None:
        raise HTTPException(status_code=500, detail="User missing id")

    result = await session.execute(
        select(ActivityProgress).where(ActivityProgress.user_id == user_id)
    )
    return result.scalars().all()


@router.get("/{activity_id}/progress", response_model=ActivityProgressRead)
async def get_my_progress(
    activity_id: int,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Get current user's progress for a specific activity."""
    user_id = current_user.id

    if user_id is None:
        raise HTTPException(status_code=500, detail="User missing id")

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == user_id,
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
    user_id = current_user.id

    if user_id is None:
        raise HTTPException(status_code=500, detail="User missing id")

    activity = await session.get(Activity, activity_id)

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == user_id,
            ActivityProgress.activity_id == activity_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        if existing.status == ActivityStatus.completed:
            raise HTTPException(
                status_code=409,
                detail="Progress already completed. Reset to start again.",
            )
        return existing

    progress = ActivityProgress(
        user_id=user_id,
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
    timeback: TimebackInstance = Depends(get_timeback),
):
    """Update progress for an activity."""
    user_id = current_user.id

    if user_id is None:
        raise HTTPException(status_code=500, detail="User missing id")

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == user_id,
            ActivityProgress.activity_id == activity_id,
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=404, detail="No progress found. Start the activity first."
        )

    if update.run_id is not None:
        progress.run_id = update.run_id
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

    is_completing = (
        update.status == ActivityStatus.completed and progress.completed_at is None
    )

    if update.status is not None:
        progress.status = update.status
        if is_completing:
            progress.completed_at = datetime.utcnow()

    progress.updated_at = datetime.utcnow()

    await session.commit()
    await session.refresh(progress)

    if is_completing:
        activity = await session.get(Activity, activity_id)
        if activity and current_user.email:
            await timeback.activity.record(
                {
                    "user": {"email": current_user.email},
                    "activity": {
                        "id": activity.activity_id,
                        "name": activity.name,
                        "course": {"code": activity.course_code},
                    },
                    "run_id": progress.run_id,
                    "metrics": {
                        "total_questions": progress.total_questions,
                        "correct_questions": progress.correct_questions,
                        "xp_earned": progress.xp_earned or 0,
                    },
                }
            )

    return progress


@router.delete("/{activity_id}/progress", status_code=204)
async def reset_progress(
    activity_id: int,
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    """Reset/delete progress for an activity (start over)."""
    user_id = current_user.id

    if user_id is None:
        raise HTTPException(status_code=500, detail="User missing id")

    result = await session.execute(
        select(ActivityProgress).where(
            ActivityProgress.user_id == user_id,
            ActivityProgress.activity_id == activity_id,
        )
    )

    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")

    await session.delete(progress)
    await session.commit()
