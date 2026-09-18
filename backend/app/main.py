import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import settings, SessionLocal, check_postgis_available, get_db
from app.routers import auth_router, projects_router, sites_router, metrics_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("darukaa.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify PostGIS & DB connectivity
    logger.info("Initializing Darukaa.Earth backend...")
    try:
        db = SessionLocal()
        gis_info = check_postgis_available(db)
        if gis_info.get("available"):
            logger.info("PostGIS is active: %s", gis_info.get("installed_version") or "enabled")
        else:
            logger.warning("PostGIS check note: %s", gis_info.get("error"))
        db.close()
    except Exception as exc:
        logger.warning("Database connection check note: %s", exc)
    yield
    # Shutdown
    logger.info("Shutting down Darukaa.Earth backend.")

app = FastAPI(
    title="Darukaa.Earth Backend API",
    description="High-performance ecological intelligence API with PostGIS spatial boundary computation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for React frontend
allowed_origins = [orig.strip() for orig in settings.ALLOWED_ORIGINS.split(",") if orig.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount application routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sites_router)
app.include_router(metrics_router)

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Darukaa.Earth Backend",
        "status": "operational",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    postgis_status = check_postgis_available(db)
    return {
        "status": "healthy",
        "database": "connected",
        "postgis": postgis_status,
    }
