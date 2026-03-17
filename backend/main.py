from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db

from routes.auth_routes import router as auth_router
from routes.profile_routes import router as profile_router
from routes.job_routes import router as job_router
from routes.application_routes import router as app_router
from routes.subscription_routes import router as sub_router
from routes.dashboard_routes import router as dashboard_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(job_router)
app.include_router(app_router)
app.include_router(sub_router)
app.include_router(dashboard_router)


@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": settings.VERSION}
