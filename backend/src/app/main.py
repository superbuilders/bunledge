from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import activities_router, users_router
from .timeback import create_timeback_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Timeback on startup."""
    timeback_router = await create_timeback_router()
    app.include_router(timeback_router, prefix="/api/timeback")

    yield


app = FastAPI(title="Bunledge API", lifespan=lifespan)

app.include_router(users_router)
app.include_router(activities_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
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
