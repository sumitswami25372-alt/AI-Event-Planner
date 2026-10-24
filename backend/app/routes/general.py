from fastapi import APIRouter
from app.config import settings
from app.schemas import ConfigResponse, HealthResponse

router = APIRouter(tags=["General"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="healthy",
        database="connected",
        environment=settings.ENVIRONMENT
    )


@router.get("/config", response_model=ConfigResponse)
def get_config():
    return ConfigResponse(
        app_name="CelebrAI — AI Celebration & Event Planner",
        version="1.0.0",
        supported_currencies=settings.supported_currencies,
        demo_mode_available=True,
        live_ai_available=settings.is_gemini_configured,
        configured_model=settings.GEMINI_MODEL
    )
