from .assessments import router as assessments_router
from .exercises import router as exercises_router
from .users import router as users_router

__all__ = ["users_router", "exercises_router", "assessments_router"]
