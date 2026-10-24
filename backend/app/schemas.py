from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


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
    color_palette: List[str] = Field(default_factory=list, max_length=10)
    decorations: List[str] = Field(default_factory=list, max_length=20)
    venue_guidance: List[str] = Field(default_factory=list, max_length=20)
    food_and_drinks: List[str] = Field(default_factory=list, max_length=20)
    entertainment: List[str] = Field(default_factory=list, max_length=20)
    timeline: List[TimelineItem] = Field(default_factory=list, max_length=30)
    budget_categories: List[BudgetCategoryItem] = Field(default_factory=list, max_length=25)
    checklist: List[ChecklistItem] = Field(default_factory=list, max_length=50)
    recommendations: List[str] = Field(default_factory=list, max_length=20)


# ==========================================
# EVENT SCHEMAS
# ==========================================

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    event_date: str = Field(..., min_length=4, max_length=50)
    location: str = Field(..., min_length=1, max_length=200)
    guest_count: int = Field(..., gt=0, le=100000)
    budget_amount: float = Field(..., gt=0, le=1000000000)
    currency: str = Field(default="INR", max_length=10)
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator("name", "category", "location")
    @classmethod
    def validate_non_whitespace(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be only whitespace")
        return s

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        from app.config import settings
        c = v.strip().upper()
        if c not in settings.supported_currencies:
            raise ValueError(f"Currency '{v}' is not supported. Supported: {settings.supported_currencies}")
        return c


class EventUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    event_date: Optional[str] = Field(default=None, min_length=4, max_length=50)
    location: Optional[str] = Field(default=None, min_length=1, max_length=200)
    guest_count: Optional[int] = Field(default=None, gt=0, le=100000)
    budget_amount: Optional[float] = Field(default=None, gt=0, le=1000000000)
    currency: Optional[str] = Field(default=None, max_length=10)
    preferences: Optional[Dict[str, Any]] = None

    @field_validator("name", "category", "location")
    @classmethod
    def validate_non_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not s:
                raise ValueError("Field cannot be only whitespace")
            return s
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            from app.config import settings
            c = v.strip().upper()
            if c not in settings.supported_currencies:
                raise ValueError(f"Currency '{v}' is not supported. Supported: {settings.supported_currencies}")
            return c
        return v


class EventResponse(BaseModel):
    id: str
    name: str
    category: str
    event_date: str
    location: str
    guest_count: int
    budget_amount: float
    currency: str
    preferences: Dict[str, Any]
    plan_json: Optional[Dict[str, Any]] = None
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
    events: List[EventResponse]
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
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty whitespace")
        return s


class ExpenseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    estimated_amount: Optional[float] = Field(default=None, ge=0)
    actual_amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", "category")
    @classmethod
    def validate_non_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not s:
                raise ValueError("Field cannot be empty whitespace")
            return s
        return v


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
    categories: Dict[str, Dict[str, float]]  # category -> {estimated, actual}


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
        s = v.strip()
        if not s:
            raise ValueError("Title cannot be empty whitespace")
        return s

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
    supported_currencies: List[str]
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
