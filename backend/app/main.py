"""
CelebrAI FastAPI application entry point.

Production Quality, Security & Efficiency features:
- Defense-in-depth SecurityHeadersMiddleware (OWASP standard headers)
- ContentSizeLimitMiddleware to reject payload flooding attacks
- Sliding-window RateLimitMiddleware (protecting expensive AI endpoints & general routes)
- High-precision ProcessTimeMiddleware (observability & X-Process-Time response header)
- GZipMiddleware for dynamic HTTP payload compression
- Hardened CORS configuration with explicit origin validation
- Resilient lifespan management and global sanitized exception handling
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import ContentSizeLimitMiddleware, SecurityHeadersMiddleware
from app.middleware.timing import ProcessTimeMiddleware
from app.routes import general, events, expenses, tasks

APP_VERSION = "1.0.0"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("celebrai.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("Initialising CelebrAI database with WAL mode…")
    init_db()
    logger.info(
        "CelebrAI %s started in %s mode (Gemini live AI: %s).",
        APP_VERSION,
        settings.ENVIRONMENT,
        "enabled" if settings.is_gemini_configured else "demo mode",
    )
    yield
    logger.info("CelebrAI %s shutting down.", APP_VERSION)


app = FastAPI(
    title="CelebrAI — AI Celebration & Event Planner API",
    description=(
        "Production-grade FastAPI backend for intelligent event planning, "
        "budgets, timelines, checklists, and PDF exports."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
)

# 1. Performance: GZip compression for payloads >= 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. Security: OWASP Defense-in-depth security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Observability & Performance: High-precision execution timing
app.add_middleware(ProcessTimeMiddleware)

# 4. Security: Sliding-window rate limiting
app.add_middleware(RateLimitMiddleware, default_limit=120, ai_limit=25)

# 5. Security: Max request payload size limit (2MB)
app.add_middleware(ContentSizeLimitMiddleware, max_body_size=2 * 1024 * 1024)

# 6. CORS — restrict to configured origins and explicit headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Request-ID"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled error processing %s %s: %s",
        request.method,
        request.url,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again or contact support."
        },
    )


# Mount versioned API routes
app.include_router(general.router, prefix="/api/v1")
app.include_router(events.router,  prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(tasks.router,   prefix="/api/v1")


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "message": "CelebrAI API is operational.",
        "docs_url": "/docs",
        "health_url": "/api/v1/health",
    }
