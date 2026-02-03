from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..db import get_session
from ..models import Exercise, ExerciseCreate, ExerciseRead

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseRead])
async def list_exercises(session: AsyncSession = Depends(get_session)):
    """List all exercises."""
    result = await session.execute(select(Exercise))
    return result.scalars().all()


@router.get("/{exercise_id}", response_model=ExerciseRead)
async def get_exercise(exercise_id: int, session: AsyncSession = Depends(get_session)):
    """Get an exercise by ID."""
    exercise = await session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.post("", response_model=ExerciseRead, status_code=201)
async def create_exercise(
    exercise: ExerciseCreate, session: AsyncSession = Depends(get_session)
):
    """Create a new exercise."""
    db_exercise = Exercise.model_validate(exercise)
    session.add(db_exercise)
    await session.commit()
    await session.refresh(db_exercise)
    return db_exercise


@router.put("/{exercise_id}", response_model=ExerciseRead)
async def update_exercise(
    exercise_id: int,
    exercise: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
):
    """Update an exercise."""
    db_exercise = await session.get(Exercise, exercise_id)
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    for key, value in exercise.model_dump().items():
        setattr(db_exercise, key, value)
    await session.commit()
    await session.refresh(db_exercise)
    return db_exercise


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: int, session: AsyncSession = Depends(get_session)
):
    """Delete an exercise."""
    exercise = await session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    await session.delete(exercise)
    await session.commit()
