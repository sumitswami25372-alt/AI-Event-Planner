from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, Expense
from app.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    BudgetSummary
)
from app.utils.currency import round_money, calculate_budget_summary

router = APIRouter(tags=["Expenses"])


@router.get("/events/{event_id}/expenses")
def get_event_expenses(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    expenses = db.query(Expense).filter(Expense.event_id == event_id).order_by(Expense.created_at.asc()).all()
    summary = calculate_budget_summary(event.budget_amount, expenses)

    return {
        "event_id": event.id,
        "currency": event.currency,
        "summary": summary,
        "expenses": [ExpenseResponse.model_validate(e) for e in expenses]
    }


@router.post("/events/{event_id}/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(event_id: str, payload: ExpenseCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    expense = Expense(
        event_id=event_id,
        name=payload.name,
        category=payload.category,
        estimated_amount=round_money(payload.estimated_amount),
        actual_amount=round_money(payload.actual_amount),
        notes=payload.notes
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: str, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id '{expense_id}' not found"
        )

    data = payload.model_dump(exclude_unset=True)
    if "estimated_amount" in data and data["estimated_amount"] is not None:
        data["estimated_amount"] = round_money(data["estimated_amount"])
    if "actual_amount" in data and data["actual_amount"] is not None:
        data["actual_amount"] = round_money(data["actual_amount"])

    for field, value in data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id '{expense_id}' not found"
        )
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
