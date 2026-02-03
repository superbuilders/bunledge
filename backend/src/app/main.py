from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .models import Assessment, Exercise, User  # noqa: F401
from .routes import assessments_router, exercises_router, users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(title="Bunledge API", lifespan=lifespan)

# Register routers
app.include_router(users_router)
app.include_router(exercises_router)
app.include_router(assessments_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/hello")
async def hello():
    """Example endpoint."""
    return {"message": "Hello from FastAPI!"}
