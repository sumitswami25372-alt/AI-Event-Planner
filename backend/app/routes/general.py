"""
General application routes — health checks and configuration.

Quality & Reliability:
- /health actively verifies SQLite connection with SELECT 1 ping
- Adds Cache-Control headers to optimize browser cache hits
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas import ConfigResponse, HealthResponse

logger = logging.getLogger("celebrai.routes.general")
router = APIRouter(tags=["General"])


@router.get("/health", response_model=HealthResponse)
def get_health(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    db_status = "connected"
    overall_status = "healthy"

    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Database health check ping failed: %s", exc)
        db_status = "disconnected"
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        database=db_status,
        environment=settings.ENVIRONMENT,
    )


@router.get("/config", response_model=ConfigResponse)
def get_config(response: Response):
    # Safe to cache config for 60 seconds
    response.headers["Cache-Control"] = "public, max-age=60"
    return ConfigResponse(
        app_name="CelebrAI — AI Celebration & Event Planner",
        version="1.0.0",
        supported_currencies=settings.supported_currencies,
        demo_mode_available=True,
        live_ai_available=settings.is_gemini_configured,
        configured_model=settings.GEMINI_MODEL,
    )
