import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Text
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    event_date = Column(String(50), nullable=False)
    location = Column(String(200), nullable=False)
    guest_count = Column(Integer, nullable=False)
    budget_amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    preferences = Column(JSON, nullable=False, default=dict)
    plan_json = Column(JSON, nullable=True)
    plan_status = Column(String(30), nullable=False, default="pending")  # pending, completed, failed
    is_demo_plan = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships with cascade delete
    expenses = relationship(
        "Expense",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    tasks = relationship(
        "ChecklistTask",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True
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
    category = Column(String(100), nullable=False)
    estimated_amount = Column(Float, nullable=False, default=0.0)
    actual_amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="expenses")


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
    category = Column(String(100), nullable=False, default="General")
    priority = Column(String(20), nullable=False, default="medium")  # low, medium, high
    due_date = Column(String(50), nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="tasks")
