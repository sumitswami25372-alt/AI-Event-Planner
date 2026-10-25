"""
Shared database helper utilities for CelebrAI routes.

Centralises the repeated "fetch-or-404" pattern so every route avoids
duplicating the same query + HTTPException block.  Using a single function
per resource type also ensures error messages and HTTP status codes are
consistent across the entire API surface.
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ChecklistTask, Event, Expense


def get_event_or_404(event_id: str, db: Session) -> Event:
    """Return the :class:`Event` with *event_id*, or raise HTTP 404."""
    event: Event | None = db.get(Event, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found",
        )
    return event


def get_expense_or_404(expense_id: str, db: Session) -> Expense:
    """Return the :class:`Expense` with *expense_id*, or raise HTTP 404."""
    expense: Expense | None = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id '{expense_id}' not found",
        )
    return expense


def get_task_or_404(task_id: str, db: Session) -> ChecklistTask:
    """Return the :class:`ChecklistTask` with *task_id*, or raise HTTP 404."""
    task: ChecklistTask | None = db.get(ChecklistTask, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found",
        )
    return task
