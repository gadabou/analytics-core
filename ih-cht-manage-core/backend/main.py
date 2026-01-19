"""
Kendeya Analytics Core - Backend API
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    postgres_host: str = "localhost"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "postgres"

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_use_ssl: bool = False

    # DHIS2
    dhis2_url: str = ""
    dhis2_user: str = ""
    dhis2_pass: str = ""
    program_tracker_id: str = ""

    # JWT
    jwt_secret: str = "secret"

    # Sync
    last_sync_file: str = "/app/data/last_sync.json"
    timeout: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Database setup
DATABASE_URL = f"postgresql://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}/{settings.postgres_db}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("Starting Kendeya Analytics Core API...")
    yield
    print("Shutting down Kendeya Analytics Core API...")


app = FastAPI(
    title="Kendeya Analytics Core API",
    description="API for Kendeya Analytics - DHIS2 Data Synchronization and Analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/main/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "version": "1.0.0"
    }


@app.get("/api/main/info")
async def get_info():
    """Get application information"""
    return {
        "name": "Kendeya Analytics Core",
        "version": "1.0.0",
        "dhis2_url": settings.dhis2_url,
        "backend_port": settings.backend_port
    }


@app.get("/api/sync/status")
async def get_sync_status():
    """Get synchronization status"""
    import json

    try:
        if os.path.exists(settings.last_sync_file):
            with open(settings.last_sync_file, "r") as f:
                return json.load(f)
    except Exception:
        pass

    return {
        "last_sync": None,
        "status": "never_synced",
        "records_synced": 0
    }


@app.post("/api/sync/trigger")
async def trigger_sync():
    """Trigger a manual synchronization"""
    # TODO: Implement DHIS2 sync logic
    return {
        "message": "Sync triggered",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
