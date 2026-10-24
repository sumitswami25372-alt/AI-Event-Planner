from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, ChecklistTask
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

router = APIRouter(tags=["Checklist Tasks"])


@router.get("/events/{event_id}/tasks", response_model=List[TaskResponse])
def get_event_tasks(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )
    tasks = db.query(ChecklistTask).filter(ChecklistTask.event_id == event_id).order_by(ChecklistTask.created_at.asc()).all()
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/events/{event_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(event_id: str, payload: TaskCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found"
        )

    task = ChecklistTask(
        event_id=event_id,
        title=payload.title,
        category=payload.category,
        priority=payload.priority,
        due_date=payload.due_date,
        completed=payload.completed
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(ChecklistTask).filter(ChecklistTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(ChecklistTask).filter(ChecklistTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
