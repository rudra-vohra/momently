from fastapi import FastAPI
from app.core.database import init_db
from app.routers.auth_router import router as auth_router
from app.routers.event_router import router as event_router
from app.routers import photo_router
from app.routers import gallery_router
from app.core.config import settings
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Photo Sharing Platform API",
    description="Event photo collaboration with PIN-protected client galleries.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(event_router, prefix="/events", tags=["Events"])
app.include_router(photo_router.router)
app.include_router(gallery_router.router)


@app.get("/", tags=["system"])
async def root():
    return {
        "message":"Server is up and running smoothly",
    }

@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}