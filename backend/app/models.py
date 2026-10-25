"""
SQLAlchemy models for CelebrAI.

Performance & Efficiency improvements:
- Added database indexes on frequently queried/sorted columns (created_at, category, plan_status, completed)
- Added composite indexes for high-speed foreign-key queries ordered by timestamp:
  - ix_expenses_event_created (event_id, created_at)
  - ix_tasks_event_created (event_id, created_at)
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    event_date = Column(String(50), nullable=False)
    location = Column(String(200), nullable=False)
    guest_count = Column(Integer, nullable=False)
    budget_amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    preferences = Column(JSON, nullable=False, default=dict)
    plan_json = Column(JSON, nullable=True)
    plan_status = Column(String(30), nullable=False, default="pending", index=True)  # pending, completed, failed
    is_demo_plan = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships with cascade delete
    expenses = relationship(
        "Expense",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Expense.created_at.asc()"
    )
    tasks = relationship(
        "ChecklistTask",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChecklistTask.created_at.asc()"
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    estimated_amount = Column(Float, nullable=False, default=0.0)
    actual_amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)

    event = relationship("Event", back_populates="expenses")

    __table_args__ = (
        Index("ix_expenses_event_created", "event_id", "created_at"),
    )


class ChecklistTask(Base):
    __tablename__ = "checklist_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = Column(String(250), nullable=False)
    category = Column(String(100), nullable=False, default="General", index=True)
    priority = Column(String(20), nullable=False, default="medium", index=True)  # low, medium, high
    due_date = Column(String(50), nullable=True)
    completed = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)

    event = relationship("Event", back_populates="tasks")

    __table_args__ = (
        Index("ix_tasks_event_created", "event_id", "created_at"),
    )
