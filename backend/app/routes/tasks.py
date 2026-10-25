"""
Checklist tasks router.

Improvements:
- get_event_or_404 / get_task_or_404 helpers replace repeated query blocks
- Return type annotations added
- Logger added
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChecklistTask
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.utils.db_helpers import get_event_or_404, get_task_or_404

logger = logging.getLogger("celebrai.routes.tasks")
router = APIRouter(tags=["Checklist Tasks"])


@router.get("/events/{event_id}/tasks", response_model=List[TaskResponse])
def get_event_tasks(event_id: str, db: Session = Depends(get_db)) -> List[TaskResponse]:
    get_event_or_404(event_id, db)  # validates existence
    tasks = (
        db.query(ChecklistTask)
        .filter(ChecklistTask.event_id == event_id)
        .order_by(ChecklistTask.created_at.asc())
        .all()
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post(
    "/events/{event_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    event_id: str, payload: TaskCreate, db: Session = Depends(get_db)
) -> TaskResponse:
    get_event_or_404(event_id, db)  # validates existence

    task = ChecklistTask(
        event_id=event_id,
        title=payload.title,
        category=payload.category,
        priority=payload.priority,
        due_date=payload.due_date,
        completed=payload.completed,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)
) -> TaskResponse:
    task = get_task_or_404(task_id, db)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)) -> Response:
    task = get_task_or_404(task_id, db)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
