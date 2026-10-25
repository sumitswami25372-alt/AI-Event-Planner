"""
Database connection, session management, and SQLite performance tuning.

High-throughput optimizations:
- WAL (Write-Ahead Logging) mode allows simultaneous readers and writers
- Synchronous=NORMAL reduces disk I/O while preserving durability
- In-memory temporary tables and 64MB page cache
- Enforced foreign key integrity
- pool_pre_ping avoids stale connections
"""
from __future__ import annotations

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# SQLite connection args
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# High-performance PRAGMAs for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(settings.DATABASE_URL):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        # WAL mode permits concurrent reads while writing
        cursor.execute("PRAGMA journal_mode=WAL")
        # NORMAL sync is faster and safe in WAL mode
        cursor.execute("PRAGMA synchronous=NORMAL")
        # 64MB page cache
        cursor.execute("PRAGMA cache_size=-64000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
