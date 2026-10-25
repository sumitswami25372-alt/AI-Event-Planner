"""
Events router — CRUD + AI plan generation + PDF export.

Improvements over previous version:
- get_event_or_404 helper eliminates repeated query+HTTPException blocks
- selectinload() eager-loads relationships to avoid N+1 queries on list_events
- event_to_dict() helper DRYs the repeated event-dict construction for plan calls
- Bulk db.add_all() replaces per-item db.add() loops for seeding expenses/tasks
- Response annotations tightened (explicit response_model everywhere)
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import ChecklistTask, Event, Expense
from app.schemas import (
    EventCreate,
    EventListResponse,
    EventResponse,
    EventUpdate,
    GeneratePlanRequest,
)
from app.services.ai_service import ai_service
from app.services.pdf_service import generate_event_pdf
from app.utils.currency import round_money
from app.utils.db_helpers import get_event_or_404

logger = logging.getLogger("celebrai.routes.events")
router = APIRouter(prefix="/events", tags=["Events"])

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _format_event_response(event: Event) -> EventResponse:
    """Build an EventResponse from an ORM Event (relationships must be loaded)."""
    expenses = event.expenses or []
    tasks = event.tasks or []

    # Single-pass accumulation for optimal cache locality and speed
    est_total_raw = 0.0
    act_total_raw = 0.0
    for e in expenses:
        est_total_raw += e.estimated_amount or 0.0
        act_total_raw += e.actual_amount or 0.0

    completed_count = sum(1 for t in tasks if t.completed)
    est_total = round_money(est_total_raw)
    act_total = round_money(act_total_raw)
    budget = event.budget_amount or 0.0
    remaining = round_money(budget - act_total)
    usage_pct = (
        round(act_total / budget * 100.0, 1)
        if budget > 0
        else 0.0
    )

    return EventResponse(
        id=event.id,
        name=event.name,
        category=event.category,
        event_date=event.event_date,
        location=event.location,
        guest_count=event.guest_count,
        budget_amount=round_money(budget),
        currency=event.currency,
        preferences=event.preferences or {},
        plan_json=event.plan_json,
        plan_status=event.plan_status,
        is_demo_plan=event.is_demo_plan,
        created_at=event.created_at,
        updated_at=event.updated_at,
        estimated_total=est_total,
        actual_total=act_total,
        remaining_budget=remaining,
        budget_usage_percentage=usage_pct,
        total_tasks=len(tasks),
        completed_tasks=completed_count,
    )


def _event_to_dict(event: Event) -> dict:
    """Serialize an Event ORM object to the dict expected by ai_service."""
    return {
        "name": event.name,
        "category": event.category,
        "event_date": event.event_date,
        "location": event.location,
        "guest_count": event.guest_count,
        "budget_amount": event.budget_amount,
        "currency": event.currency,
        "preferences": event.preferences,
    }


def _seed_expenses(plan, event_id: str) -> list[Expense]:
    return [
        Expense(
            event_id=event_id,
            name=b.name,
            category=b.name,
            estimated_amount=round_money(b.estimated_cost),
            actual_amount=0.0,
            notes=b.notes or "Initial estimate from AI plan",
        )
        for b in plan.budget_categories
    ]


def _seed_tasks(plan, event_id: str) -> list[ChecklistTask]:
    return [
        ChecklistTask(
            event_id=event_id,
            title=t.title,
            category=t.category or "General",
            priority=t.priority or "medium",
            due_date=f"{t.days_before_event} days before event",
            completed=False,
        )
        for t in plan.checklist
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Session = Depends(get_db)) -> EventResponse:
    event = Event(
        name=payload.name,
        category=payload.category,
        event_date=payload.event_date,
        location=payload.location,
        guest_count=payload.guest_count,
        budget_amount=round_money(payload.budget_amount),
        currency=payload.currency,
        preferences=payload.preferences or {},
        plan_status="pending",
        is_demo_plan=False,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    try:
        plan, is_demo = await ai_service.generate_plan(_event_to_dict(event))
        event.plan_json = plan.model_dump()
        event.plan_status = "completed"
        event.is_demo_plan = is_demo

        db.add_all(_seed_expenses(plan, event.id))
        db.add_all(_seed_tasks(plan, event.id))
        db.commit()
        db.refresh(event)
    except Exception as e:
        logger.error("Automatic plan generation failed on event creation: %s", e)
        event.plan_status = "failed"
        db.commit()
        db.refresh(event)

    return _format_event_response(event)


@router.get("", response_model=EventListResponse)
def list_events(db: Session = Depends(get_db)) -> EventListResponse:
    # Eager-load relationships in one query to avoid N+1 per event
    events: list[Event] = (
        db.query(Event)
        .options(selectinload(Event.expenses), selectinload(Event.tasks))
        .order_by(Event.created_at.desc())
        .all()
    )
    formatted = [_format_event_response(e) for e in events]
    return EventListResponse(events=formatted, total_count=len(formatted))


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)) -> EventResponse:
    event: Event | None = (
        db.query(Event)
        .options(selectinload(Event.expenses), selectinload(Event.tasks))
        .filter(Event.id == event_id)
        .first()
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found",
        )
    return _format_event_response(event)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, payload: EventUpdate, db: Session = Depends(get_db)) -> EventResponse:
    event = get_event_or_404(event_id, db)

    data = payload.model_dump(exclude_unset=True)
    if data.get("budget_amount") is not None:
        data["budget_amount"] = round_money(data["budget_amount"])

    for field, value in data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return _format_event_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: str, db: Session = Depends(get_db)) -> Response:
    event = get_event_or_404(event_id, db)
    db.delete(event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{event_id}/generate-plan", response_model=EventResponse)
async def generate_plan_for_event(
    event_id: str,
    payload: GeneratePlanRequest | None = None,
    db: Session = Depends(get_db),
) -> EventResponse:
    event = get_event_or_404(event_id, db)
    force_demo = payload.force_demo if payload else False

    try:
        plan, is_demo = await ai_service.generate_plan(
            _event_to_dict(event), force_demo=force_demo
        )
        event.plan_json = plan.model_dump()
        event.plan_status = "completed"
        event.is_demo_plan = is_demo

        if not event.expenses:
            db.add_all(_seed_expenses(plan, event.id))
        if not event.tasks:
            db.add_all(_seed_tasks(plan, event.id))

        db.commit()
        db.refresh(event)
        return _format_event_response(event)
    except Exception as e:
        logger.error("Plan generation failed for event %s: %s", event_id, e, exc_info=True)
        event.plan_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plan generation failed. Please try again or switch to demo mode.",
        )


@router.get("/{event_id}/plan")
def get_event_plan(event_id: str, db: Session = Depends(get_db)) -> dict:
    event = get_event_or_404(event_id, db)
    return {
        "event_id": event.id,
        "plan_status": event.plan_status,
        "is_demo_plan": event.is_demo_plan,
        "plan": event.plan_json,
    }


@router.get("/{event_id}/export-pdf")
def export_pdf(event_id: str, db: Session = Depends(get_db)) -> Response:
    event = get_event_or_404(event_id, db)

    event_data = {
        "name": event.name,
        "category": event.category,
        "event_date": event.event_date,
        "location": event.location,
        "guest_count": event.guest_count,
        "budget_amount": event.budget_amount,
        "currency": event.currency,
        "plan_json": event.plan_json,
    }
    expenses_data = [
        {
            "name": e.name,
            "category": e.category,
            "estimated_amount": e.estimated_amount,
            "actual_amount": e.actual_amount,
        }
        for e in event.expenses
    ]
    tasks_data = [
        {
            "title": t.title,
            "category": t.category,
            "priority": t.priority,
            "completed": t.completed,
        }
        for t in event.tasks
    ]

    try:
        pdf_bytes = generate_event_pdf(event_data, expenses_data, tasks_data)
        safe_filename = "".join(
            c for c in event.name.lower().replace(" ", "_") if c.isalnum() or c == "_"
        )[:50]
        if not safe_filename:
            safe_filename = f"event_{event.id[:8]}"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="celebrai_{safe_filename}.pdf"'
            },
        )
    except Exception as e:
        logger.error("PDF generation failed for event %s: %s", event_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF document. Please try again later.",
        )
