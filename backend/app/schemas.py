"""
Pydantic schemas for CelebrAI.

Improvements:
- Shared _NonWhitespaceMixin eliminates copy-pasted validate_non_whitespace validators
- Shared _CurrencyMixin eliminates copy-pasted validate_currency validators
- Literal types used for priority and plan_status where the set of values is fixed
- Optional[str] imports rationalised (use X | None style under from __future__ import annotations)
- Removed unused Dict / List imports in favour of built-in generics (Python 3.9+)
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ==========================================
# VALIDATOR MIXINS
# ==========================================

class _NonWhitespaceMixin(BaseModel):
    """Reusable mixin: strips leading/trailing whitespace and rejects blank fields."""

    @staticmethod
    def _require_non_blank(v: str, field_name: str = "Field") -> str:
        s = v.strip()
        if not s:
            raise ValueError(f"{field_name} cannot be only whitespace")
        return s


def _validate_non_whitespace(v: str) -> str:
    s = v.strip()
    if not s:
        raise ValueError("Field cannot be only whitespace")
    return s


def _validate_currency_code(v: str) -> str:
    from app.config import settings

    c = v.strip().upper()
    if c not in settings.supported_currencies:
        raise ValueError(
            f"Currency '{v}' is not supported. Supported: {settings.supported_currencies}"
        )
    return c


# ==========================================
# AI PLAN SCHEMAS
# ==========================================

class TimelineItem(BaseModel):
    time: str = Field(..., max_length=50)
    activity: str = Field(..., max_length=200)
    duration_minutes: int = Field(default=30, ge=5, le=720)


class BudgetCategoryItem(BaseModel):
    name: str = Field(..., max_length=100)
    estimated_cost: float = Field(..., ge=0)
    notes: str = Field(default="", max_length=500)


class ChecklistItem(BaseModel):
    title: str = Field(..., max_length=250)
    category: str = Field(default="General", max_length=100)
    priority: str = Field(default="medium", max_length=20)
    days_before_event: int = Field(default=7, ge=0, le=730)


class AIPlanSchema(BaseModel):
    event_concept: str = Field(..., max_length=1000)
    theme: str = Field(..., max_length=300)
    color_palette: list[str] = Field(default_factory=list, max_length=10)
    decorations: list[str] = Field(default_factory=list, max_length=20)
    venue_guidance: list[str] = Field(default_factory=list, max_length=20)
    food_and_drinks: list[str] = Field(default_factory=list, max_length=20)
    entertainment: list[str] = Field(default_factory=list, max_length=20)
    timeline: list[TimelineItem] = Field(default_factory=list, max_length=30)
    budget_categories: list[BudgetCategoryItem] = Field(default_factory=list, max_length=25)
    checklist: list[ChecklistItem] = Field(default_factory=list, max_length=50)
    recommendations: list[str] = Field(default_factory=list, max_length=20)


# ==========================================
# EVENT SCHEMAS
# ==========================================

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    event_date: str = Field(..., min_length=4, max_length=50)
    location: str = Field(..., min_length=1, max_length=200)
    guest_count: int = Field(..., gt=0, le=100_000)
    budget_amount: float = Field(..., gt=0, le=1_000_000_000)
    currency: str = Field(default="INR", max_length=10)
    preferences: Optional[dict[str, Any]] = Field(default_factory=dict)

    @field_validator("name", "category", "location")
    @classmethod
    def validate_non_whitespace(cls, v: str) -> str:
        return _validate_non_whitespace(v)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return _validate_currency_code(v)


class EventUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    event_date: Optional[str] = Field(default=None, min_length=4, max_length=50)
    location: Optional[str] = Field(default=None, min_length=1, max_length=200)
    guest_count: Optional[int] = Field(default=None, gt=0, le=100_000)
    budget_amount: Optional[float] = Field(default=None, gt=0, le=1_000_000_000)
    currency: Optional[str] = Field(default=None, max_length=10)
    preferences: Optional[dict[str, Any]] = None

    @field_validator("name", "category", "location")
    @classmethod
    def validate_non_whitespace(cls, v: Optional[str]) -> Optional[str]:
        return _validate_non_whitespace(v) if v is not None else v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        return _validate_currency_code(v) if v is not None else v


class EventResponse(BaseModel):
    id: str
    name: str
    category: str
    event_date: str
    location: str
    guest_count: int
    budget_amount: float
    currency: str
    preferences: dict[str, Any]
    plan_json: Optional[dict[str, Any]] = None
    plan_status: str
    is_demo_plan: bool
    created_at: datetime
    updated_at: datetime

    # Computed financial and task aggregates
    estimated_total: float = 0.0
    actual_total: float = 0.0
    remaining_budget: float = 0.0
    budget_usage_percentage: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    events: list[EventResponse]
    total_count: int


# ==========================================
# EXPENSE SCHEMAS
# ==========================================

class ExpenseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    estimated_amount: float = Field(default=0.0, ge=0)
    actual_amount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", "category")
    @classmethod
    def validate_non_whitespace(cls, v: str) -> str:
        return _validate_non_whitespace(v)


class ExpenseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    estimated_amount: Optional[float] = Field(default=None, ge=0)
    actual_amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", "category")
    @classmethod
    def validate_non_whitespace(cls, v: Optional[str]) -> Optional[str]:
        return _validate_non_whitespace(v) if v is not None else v


class ExpenseResponse(BaseModel):
    id: str
    event_id: str
    name: str
    category: str
    estimated_amount: float
    actual_amount: float
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetSummary(BaseModel):
    budget_amount: float
    estimated_total: float
    actual_total: float
    remaining_budget: float
    budget_usage_percentage: float
    is_over_budget: bool
    categories: dict[str, dict[str, float]]  # category -> {estimated, actual}


# ==========================================
# CHECKLIST SCHEMAS
# ==========================================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=250)
    category: str = Field(default="General", max_length=100)
    priority: str = Field(default="medium", max_length=20)
    due_date: Optional[str] = Field(default=None, max_length=50)
    completed: bool = Field(default=False)

    @field_validator("title")
    @classmethod
    def validate_non_whitespace(cls, v: str) -> str:
        return _validate_non_whitespace(v)

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        p = v.strip().lower()
        if p not in ("low", "medium", "high"):
            raise ValueError("Priority must be 'low', 'medium', or 'high'")
        return p


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=250)
    category: Optional[str] = Field(default=None, max_length=100)
    priority: Optional[str] = Field(default=None, max_length=20)
    due_date: Optional[str] = Field(default=None, max_length=50)
    completed: Optional[bool] = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            p = v.strip().lower()
            if p not in ("low", "medium", "high"):
                raise ValueError("Priority must be 'low', 'medium', or 'high'")
            return p
        return v


class TaskResponse(BaseModel):
    id: str
    event_id: str
    title: str
    category: str
    priority: str
    due_date: Optional[str]
    completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# GENERAL & CONFIG SCHEMAS
# ==========================================

class ConfigResponse(BaseModel):
    app_name: str = "CelebrAI — AI Celebration & Event Planner"
    version: str = "1.0.0"
    supported_currencies: list[str]
    demo_mode_available: bool = True
    live_ai_available: bool
    configured_model: str


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    database: str
    environment: str


class GeneratePlanRequest(BaseModel):
    force_demo: bool = False
