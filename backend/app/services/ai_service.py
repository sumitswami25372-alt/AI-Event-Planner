"""
AI service — wraps the Gemini API with a demo-plan fallback.

Improvements:
- google-genai imports moved to module level (avoids repeated import overhead)
- genai.Client cached as an instance attribute (one TLS connection pool reused)
- asyncio imported at module level
- Redundant markdown-fence stripping retained as a safety net, but only applied
  when response_mime_type JSON enforcement still leaks fences
- Use lazy client instantiation so import doesn't fail when SDK is absent and
  demo mode is being used
- Logger calls use %s formatting (cheaper when log level is filtered)
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.config import settings
from app.schemas import AIPlanSchema
from app.services.demo_planner import generate_demo_plan

logger = logging.getLogger("celebrai.ai_service")

# Lazy SDK import guard — SDK may not be installed in demo-only deployments
try:
    from google import genai  # type: ignore
    from google.genai import types as genai_types  # type: ignore
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    logger.warning("google-genai SDK not installed; live AI calls unavailable.")


def _strip_markdown_fences(text: str) -> str:
    """Remove accidental markdown code fences from model output."""
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    text = text.removesuffix("```")
    return text.strip()


class AIService:
    """Thin wrapper around the Gemini generative AI API."""

    def __init__(self) -> None:
        self._client: genai.Client | None = None  # lazy — created on first live call

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def can_use_live_ai(self) -> bool:
        return _GENAI_AVAILABLE and settings.is_gemini_configured

    @property
    def _gemini_client(self) -> genai.Client:
        """Return (or create) the shared Gemini client instance."""
        if self._client is None:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    # ------------------------------------------------------------------
    # Core generation
    # ------------------------------------------------------------------

    async def generate_plan(
        self, event_data: dict[str, Any], force_demo: bool = False
    ) -> tuple[AIPlanSchema, bool]:
        """
        Generate an event plan.

        Returns ``(AIPlanSchema, is_demo_plan)``.  If *force_demo* is True or
        if live AI is unavailable/fails, the deterministic demo planner is used.
        """
        if force_demo or not self.can_use_live_ai():
            logger.info("Using deterministic demo planner for plan generation.")
            return generate_demo_plan(event_data), True

        try:
            logger.info(
                "Calling Gemini API model '%s' (timeout=%ss)…",
                settings.GEMINI_MODEL,
                settings.AI_TIMEOUT_SECONDS,
            )
            plan = await self._call_gemini(event_data)
            return plan, False
        except Exception as exc:
            logger.warning(
                "Live Gemini call failed (%s). Falling back to demo plan.", exc
            )
            return generate_demo_plan(event_data), True

    # ------------------------------------------------------------------
    # Private Gemini call
    # ------------------------------------------------------------------

    async def _call_gemini(self, event_data: dict[str, Any]) -> AIPlanSchema:
        """Execute the blocking Gemini SDK call in a thread pool."""
        name = event_data.get("name", "Celebration")
        category = event_data.get("category", "Party")
        budget = event_data.get("budget_amount", 50000)
        currency = event_data.get("currency", "INR")
        guests = event_data.get("guest_count", 50)
        location = event_data.get("location", "City")
        prefs: dict = event_data.get("preferences") or {}

        prompt = (
            "You are CelebrAI, an expert production celebration and event planner.\n"
            "Generate a comprehensive, realistic event plan in valid JSON format matching this exact schema:\n"
            "{\n"
            '  "event_concept": "Inspiring summary concept description",\n'
            '  "theme": "Theme description",\n'
            '  "color_palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],\n'
            '  "decorations": ["decor recommendation 1", "decor recommendation 2", "decor recommendation 3"],\n'
            '  "venue_guidance": ["venue advice 1", "venue advice 2"],\n'
            '  "food_and_drinks": ["culinary recommendation 1", "culinary recommendation 2", "culinary recommendation 3"],\n'
            '  "entertainment": ["activity 1", "activity 2"],\n'
            '  "timeline": [\n'
            '    {"time": "02:00 PM", "activity": "Activity description", "duration_minutes": 60}\n'
            "  ],\n"
            '  "budget_categories": [\n'
            '    {"name": "Venue", "estimated_cost": 15000, "notes": "Details"}\n'
            "  ],\n"
            '  "checklist": [\n'
            '    {"title": "Task title", "category": "Category", "priority": "high", "days_before_event": 30}\n'
            "  ],\n"
            '  "recommendations": ["pro-tip 1", "pro-tip 2"]\n'
            "}\n\n"
            "CRITICAL REQUIREMENTS:\n"
            f'- Event: "{name}" ({category})\n'
            f"- Guest count: {guests} attendees\n"
            f"- Total target budget: {budget} {currency}\n"
            f"- Location: {location}\n"
            f"- Planning style: {prefs.get('planning_style', 'balanced')}\n"
            f"- Theme & Colors: {prefs.get('theme_colors', 'Elegant')}\n"
            f"- Dietary: {prefs.get('dietary', 'Standard')}\n"
            f"- Special instructions: {prefs.get('additional_instructions', 'None')}\n\n"
            "IMPORTANT RULES:\n"
            f"1. Ensure the sum of estimated_cost in budget_categories is close to or strictly within "
            f"the target budget of {budget} {currency}.\n"
            "2. All costs must be nonnegative numbers.\n"
            "3. Provide at least 5 timeline steps and at least 6 checklist tasks.\n"
            "4. Output RAW JSON ONLY. No markdown, no markdown codeblocks, no extra explanation."
        )

        response = await asyncio.wait_for(
            asyncio.to_thread(
                self._gemini_client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.6,
                ),
            ),
            timeout=float(settings.AI_TIMEOUT_SECONDS),
        )

        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")

        raw_text = _strip_markdown_fences(response.text.strip())
        data = json.loads(raw_text)
        return AIPlanSchema(**data)


# Module-level singleton
ai_service = AIService()
