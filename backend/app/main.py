import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db
from app.routes import general, events, expenses, tasks

# Configure safe logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("celebrai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CelebrAI database...")
    init_db()
    logger.info(f"CelebrAI backend started in {settings.ENVIRONMENT} mode.")
    yield
    logger.info("CelebrAI backend shutting down.")


app = FastAPI(
    title="CelebrAI — AI Celebration & Event Planner API",
    description="Production-grade FastAPI backend for intelligent event planning, budgets, timelines, checklists, and PDF exports.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware restricted to configured development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again or check backend logs."}
    )


# Mount versioned API routes
app.include_router(general.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "CelebrAI API is operational.",
        "docs_url": "/docs",
        "health_url": "/api/v1/health"
    }
