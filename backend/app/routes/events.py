import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, Expense, ChecklistTask
from app.schemas import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
    GeneratePlanRequest
)
from app.services.ai_service import ai_service
from app.services.pdf_service import generate_event_pdf
from app.utils.currency import round_money

logger = logging.getLogger("celebrai.routes.events")
router = APIRouter(prefix="/events", tags=["Events"])


def format_event_response(event: Event) -> EventResponse:
    expenses = event.expenses or []
    tasks = event.tasks or []

    est_total = round_money(sum(e.estimated_amount or 0.0 for e in expenses))
    act_total = round_money(sum(e.actual_amount or 0.0 for e in expenses))
    remaining = round_money(event.budget_amount - act_total)
    usage_pct = round((act_total / event.budget_amount * 100.0), 1) if event.budget_amount > 0 else 0.0

    completed_count = sum(1 for t in tasks if t.completed)

    return EventResponse(
        id=event.id,
        name=event.name,
        category=event.category,
        event_date=event.event_date,
        location=event.location,
        guest_count=event.guest_count,
        budget_amount=round_money(event.budget_amount),
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
        completed_tasks=completed_count
    )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Session = Depends(get_db)):
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
        is_demo_plan=False
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Immediately attempt plan generation
    try:
        plan, is_demo = await ai_service.generate_plan({
            "name": event.name,
            "category": event.category,
            "event_date": event.event_date,
            "location": event.location,
            "guest_count": event.guest_count,
            "budget_amount": event.budget_amount,
            "currency": event.currency,
            "preferences": event.preferences
        })

        event.plan_json = plan.model_dump()
        event.plan_status = "completed"
        event.is_demo_plan = is_demo

        # Auto-populate initial expenses from budget_categories
        for b_item in plan.budget_categories:
            db.add(Expense(
                event_id=event.id,
                name=b_item.name,
                category=b_item.name,
                estimated_amount=round_money(b_item.estimated_cost),
                actual_amount=0.0,
                notes=b_item.notes or "Initial estimate from AI plan"
            ))

        # Auto-populate initial tasks from checklist
        for t_item in plan.checklist:
            db.add(ChecklistTask(
                event_id=event.id,
                title=t_item.title,
                category=t_item.category or "General",
                priority=t_item.priority or "medium",
                due_date=f"{t_item.days_before_event} days before event",
                completed=False
            ))

        db.commit()
        db.refresh(event)
    except Exception as e:
        logger.error(f"Automatic plan generation failed on event creation: {e}")
        event.plan_status = "failed"
        db.commit()
        db.refresh(event)

    return format_event_response(event)


@router.get("", response_model=EventListResponse)
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    formatted = [format_event_response(e) for e in events]
    return EventListResponse(events=formatted, total_count=len(formatted))


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )
    return format_event_response(event)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, payload: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    data = payload.model_dump(exclude_unset=True)
    if "budget_amount" in data and data["budget_amount"] is not None:
        data["budget_amount"] = round_money(data["budget_amount"])

    for field, value in data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return format_event_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )
    db.delete(event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{event_id}/generate-plan", response_model=EventResponse)
async def generate_plan_for_event(
    event_id: str,
    payload: Optional[GeneratePlanRequest] = None,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    force_demo = payload.force_demo if payload else False

    try:
        plan, is_demo = await ai_service.generate_plan({
            "name": event.name,
            "category": event.category,
            "event_date": event.event_date,
            "location": event.location,
            "guest_count": event.guest_count,
            "budget_amount": event.budget_amount,
            "currency": event.currency,
            "preferences": event.preferences
        }, force_demo=force_demo)

        event.plan_json = plan.model_dump()
        event.plan_status = "completed"
        event.is_demo_plan = is_demo

        # If event has no expenses yet, seed them
        if not event.expenses:
            for b_item in plan.budget_categories:
                db.add(Expense(
                    event_id=event.id,
                    name=b_item.name,
                    category=b_item.name,
                    estimated_amount=round_money(b_item.estimated_cost),
                    actual_amount=0.0,
                    notes=b_item.notes or "Initial estimate from AI plan"
                ))

        # If event has no tasks yet, seed them
        if not event.tasks:
            for t_item in plan.checklist:
                db.add(ChecklistTask(
                    event_id=event.id,
                    title=t_item.title,
                    category=t_item.category or "General",
                    priority=t_item.priority or "medium",
                    due_date=f"{t_item.days_before_event} days before event",
                    completed=False
                ))

        db.commit()
        db.refresh(event)
        return format_event_response(event)
    except Exception as e:
        logger.error(f"Plan generation failed for event {event_id}: {e}")
        event.plan_status = "failed"
        db.commit()
        db.refresh(event)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan generation failed: {str(e)}"
        )


@router.get("/{event_id}/plan")
def get_event_plan(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )
    return {
        "event_id": event.id,
        "plan_status": event.plan_status,
        "is_demo_plan": event.is_demo_plan,
        "plan": event.plan_json
    }


@router.get("/{event_id}/export-pdf")
def export_pdf(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    event_data = {
        "name": event.name,
        "category": event.category,
        "event_date": event.event_date,
        "location": event.location,
        "guest_count": event.guest_count,
        "budget_amount": event.budget_amount,
        "currency": event.currency,
        "plan_json": event.plan_json
    }

    expenses_data = [
        {
            "name": e.name,
            "category": e.category,
            "estimated_amount": e.estimated_amount,
            "actual_amount": e.actual_amount
        }
        for e in event.expenses
    ]

    tasks_data = [
        {
            "title": t.title,
            "category": t.category,
            "priority": t.priority,
            "completed": t.completed
        }
        for t in event.tasks
    ]

    try:
        pdf_bytes = generate_event_pdf(event_data, expenses_data, tasks_data)
        safe_filename = "".join(c for c in event.name.lower().replace(" ", "_") if c.isalnum() or c == "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="celebrai_{safe_filename}.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"PDF generation failed for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )
