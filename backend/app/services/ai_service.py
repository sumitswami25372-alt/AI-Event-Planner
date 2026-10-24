import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.schemas import AIPlanSchema
from app.services.demo_planner import generate_demo_plan

logger = logging.getLogger("celebrai.ai_service")


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.timeout = settings.AI_TIMEOUT_SECONDS

    def can_use_live_ai(self) -> bool:
        return settings.is_gemini_configured

    async def generate_plan(self, event_data: Dict[str, Any], force_demo: bool = False) -> Tuple[AIPlanSchema, bool]:
        """
        Generates an event plan.
        Returns (AIPlanSchema, is_demo_plan: bool).
        If force_demo is True or if live AI fails/is not configured, returns demo plan safely.
        """
        if force_demo or not self.can_use_live_ai():
            logger.info("Using deterministic demo planner for event plan generation.")
            plan = generate_demo_plan(event_data)
            return plan, True

        try:
            logger.info(f"Calling Gemini API model '{self.model}' with {self.timeout}s timeout...")
            plan = await self._call_gemini(event_data)
            return plan, False
        except Exception as e:
            logger.warning(f"Live Gemini API call failed or timed out ({str(e)}). Falling back to demo plan.")
            plan = generate_demo_plan(event_data)
            return plan, True

    async def _call_gemini(self, event_data: Dict[str, Any]) -> AIPlanSchema:
        """
        Direct call using official google-genai SDK.
        """
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        name = event_data.get("name", "Celebration")
        category = event_data.get("category", "Party")
        budget = event_data.get("budget_amount", 50000)
        currency = event_data.get("currency", "INR")
        guests = event_data.get("guest_count", 50)
        location = event_data.get("location", "City")
        prefs = event_data.get("preferences") or {}

        prompt = f"""You are CelebrAI, an expert production celebration and event planner.
Generate a comprehensive, realistic event plan in valid JSON format matching this exact schema:
{{
  "event_concept": "Inspiring summary concept description",
  "theme": "Theme description",
  "color_palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],
  "decorations": ["decor recommendation 1", "decor recommendation 2", "decor recommendation 3"],
  "venue_guidance": ["venue advice 1", "venue advice 2"],
  "food_and_drinks": ["culinary recommendation 1", "culinary recommendation 2", "culinary recommendation 3"],
  "entertainment": ["activity 1", "activity 2"],
  "timeline": [
    {{"time": "02:00 PM", "activity": "Activity description", "duration_minutes": 60}}
  ],
  "budget_categories": [
    {{"name": "Venue", "estimated_cost": 15000, "notes": "Details"}}
  ],
  "checklist": [
    {{"title": "Task title", "category": "Category", "priority": "high", "days_before_event": 30}}
  ],
  "recommendations": ["pro-tip 1", "pro-tip 2"]
}}

CRITICAL REQUIREMENTS:
- Event: "{name}" ({category})
- Guest count: {guests} attendees
- Total target budget: {budget} {currency}
- Location: {location}
- Planning style: {prefs.get('planning_style', 'balanced')}
- Theme & Colors: {prefs.get('theme_colors', 'Elegant')}
- Dietary: {prefs.get('dietary', 'Standard')}
- Special instructions: {prefs.get('additional_instructions', 'None')}

IMPORTANT RULES:
1. Ensure the sum of estimated_cost in budget_categories is close to or strictly within the target budget of {budget} {currency}.
2. All costs must be nonnegative numbers.
3. Provide at least 5 timeline steps and at least 6 checklist tasks.
4. Output RAW JSON ONLY. No markdown, no markdown codeblocks, no extra explanation."""

        # Call with timeout
        import asyncio
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.6,
                )
            ),
            timeout=float(self.timeout)
        )

        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")

        raw_text = response.text.strip()
        # Clean potential markdown fences
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        data = json.loads(raw_text)
        # Strictly validate using Pydantic schema
        validated_plan = AIPlanSchema(**data)
        return validated_plan


ai_service = AIService()
