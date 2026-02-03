from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..db import get_session
from ..models import Assessment, AssessmentCreate, AssessmentRead

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.get("", response_model=list[AssessmentRead])
async def list_assessments(
    user_id: int | None = Query(default=None),
    exercise_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    """List assessments, optionally filtered by user_id or exercise_id."""
    query = select(Assessment)
    if user_id is not None:
        query = query.where(Assessment.user_id == user_id)
    if exercise_id is not None:
        query = query.where(Assessment.exercise_id == exercise_id)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{assessment_id}", response_model=AssessmentRead)
async def get_assessment(
    assessment_id: int, session: AsyncSession = Depends(get_session)
):
    """Get an assessment by ID."""
    assessment = await session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("", response_model=AssessmentRead, status_code=201)
async def create_assessment(
    assessment: AssessmentCreate, session: AsyncSession = Depends(get_session)
):
    """Create a new assessment."""
    db_assessment = Assessment.model_validate(assessment)
    session.add(db_assessment)
    await session.commit()
    await session.refresh(db_assessment)
    return db_assessment


@router.put("/{assessment_id}", response_model=AssessmentRead)
async def update_assessment(
    assessment_id: int,
    assessment: AssessmentCreate,
    session: AsyncSession = Depends(get_session),
):
    """Update an assessment."""
    db_assessment = await session.get(Assessment, assessment_id)
    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    for key, value in assessment.model_dump().items():
        setattr(db_assessment, key, value)
    await session.commit()
    await session.refresh(db_assessment)
    return db_assessment


@router.delete("/{assessment_id}", status_code=204)
async def delete_assessment(
    assessment_id: int, session: AsyncSession = Depends(get_session)
):
    """Delete an assessment."""
    assessment = await session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    await session.delete(assessment)
    await session.commit()
