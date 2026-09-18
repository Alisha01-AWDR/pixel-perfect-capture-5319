import os
import sys
from typing import Generator

# On Windows, ensure system libpq from PostgreSQL installation is loaded
if sys.platform == "win32":
    for pg_bin in [
        r"C:\Program Files\PostgreSQL\18\bin",
        r"C:\Program Files\PostgreSQL\17\bin",
        r"C:\Program Files\PostgreSQL\16\bin",
    ]:
        if os.path.exists(pg_bin):
            try:
                os.add_dll_directory(pg_bin)
            except Exception:
                pass
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/darukaa"
    JWT_SECRET_KEY: str = "darukaa_secret_key_hackathon_super_secure_key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Setup SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Database session dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_postgis_available(db: Session) -> dict:
    """Verifies PostGIS extension is present and returns version info."""
    try:
        # Check PostGIS extension status
        ext_query = text("SELECT default_version, installed_version FROM pg_available_extensions WHERE name = 'postgis';")
        ext_res = db.execute(ext_query).mappings().first()

        version_query = text("SELECT PostGIS_Full_Version();")
        full_version = db.execute(version_query).scalar()

        return {
            "available": True,
            "installed_version": ext_res["installed_version"] if ext_res else None,
            "full_version": full_version,
        }
    except Exception as exc:
        return {
            "available": False,
            "error": str(exc),
        }
