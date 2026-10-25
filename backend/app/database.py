"""
Database connection, session management, and SQLite performance tuning.

High-throughput optimizations:
- WAL (Write-Ahead Logging) mode allows simultaneous readers and writers
- Synchronous=NORMAL reduces disk I/O while preserving durability
- In-memory temporary tables and 64MB page cache
- Enforced foreign key integrity
- pool_pre_ping avoids stale connections
- Safe fallback for serverless/read-only filesystems
"""
from __future__ import annotations

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

db_url = settings.effective_database_url

# SQLite connection args
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# High-performance PRAGMAs for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(settings.effective_database_url):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        try:
            # WAL mode permits concurrent reads while writing
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")
            cursor.execute("PRAGMA temp_store=MEMORY")
        except Exception:
            # Fallback gracefully if filesystem prevents WAL
            pass
        finally:
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
