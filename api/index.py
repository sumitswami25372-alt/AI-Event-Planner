"""
Vercel-compatible FastAPI entrypoint.
Vercel looks for the `app` object in api/index.py (or similar paths).
We import the fully-configured FastAPI application from the backend package
and re-export it so Vercel's Python runtime can serve it.
"""
import sys
import os

# Add the backend directory to the Python path so that
# `from app.xxx import ...` works correctly from this entrypoint.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(BACKEND_DIR))

# Import the fully-configured FastAPI application
from app.main import app  # noqa: F401, E402

# `app` is now available at module level — Vercel will pick it up automatically.
