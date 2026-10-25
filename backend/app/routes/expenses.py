"""
Expenses router — budget tracking per event.

Improvements:
- get_event_or_404 / get_expense_or_404 helpers replace repeated query blocks
- Type annotations added for all route return values
- Logger added for error tracing consistency
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, Expense
from app.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)
from app.utils.currency import round_money, calculate_budget_summary
from app.utils.db_helpers import get_event_or_404, get_expense_or_404

logger = logging.getLogger("celebrai.routes.expenses")
router = APIRouter(tags=["Expenses"])


@router.get("/events/{event_id}/expenses")
def get_event_expenses(event_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    event = get_event_or_404(event_id, db)
    expenses = (
        db.query(Expense)
        .filter(Expense.event_id == event_id)
        .order_by(Expense.created_at.asc())
        .all()
    )
    summary = calculate_budget_summary(event.budget_amount, expenses)
    return {
        "event_id": event.id,
        "currency": event.currency,
        "summary": summary,
        "expenses": [ExpenseResponse.model_validate(e) for e in expenses],
    }


@router.post(
    "/events/{event_id}/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    event_id: str, payload: ExpenseCreate, db: Session = Depends(get_db)
) -> ExpenseResponse:
    get_event_or_404(event_id, db)  # validates existence

    expense = Expense(
        event_id=event_id,
        name=payload.name,
        category=payload.category,
        estimated_amount=round_money(payload.estimated_amount),
        actual_amount=round_money(payload.actual_amount),
        notes=payload.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str, payload: ExpenseUpdate, db: Session = Depends(get_db)
) -> ExpenseResponse:
    expense = get_expense_or_404(expense_id, db)

    data = payload.model_dump(exclude_unset=True)
    if data.get("estimated_amount") is not None:
        data["estimated_amount"] = round_money(data["estimated_amount"])
    if data.get("actual_amount") is not None:
        data["actual_amount"] = round_money(data["actual_amount"])

    for field, value in data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: str, db: Session = Depends(get_db)) -> Response:
    expense = get_expense_or_404(expense_id, db)
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
