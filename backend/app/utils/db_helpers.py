"""
Shared database helper utilities.

Centralises the repeated "fetch-or-404" pattern so that every route avoids
duplicating the same query + HTTPException block.
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Event, Expense, ChecklistTask


def get_event_or_404(event_id: str, db: Session) -> Event:
    """Return the Event with *event_id* or raise HTTP 404."""
    event: Event | None = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found",
        )
    return event


def get_expense_or_404(expense_id: str, db: Session) -> Expense:
    """Return the Expense with *expense_id* or raise HTTP 404."""
    expense: Expense | None = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id '{expense_id}' not found",
        )
    return expense


def get_task_or_404(task_id: str, db: Session) -> ChecklistTask:
    """Return the ChecklistTask with *task_id* or raise HTTP 404."""
    task: ChecklistTask | None = db.query(ChecklistTask).filter(ChecklistTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found",
        )
    return task
