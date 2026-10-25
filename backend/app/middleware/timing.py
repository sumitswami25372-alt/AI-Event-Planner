"""
Request execution timing and performance monitoring middleware.

Adds `X-Process-Time` header to all responses and logs slow queries.
"""
from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("celebrai.performance")


class ProcessTimeMiddleware(BaseHTTPMiddleware):
    """Measures total request processing time and annotates response headers."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response: Response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000.0

        formatted_time = f"{process_time_ms:.2f}ms"
        response.headers["X-Process-Time"] = formatted_time

        # Warn on slow requests (> 800ms) for observability
        if process_time_ms > 800.0:
            logger.warning(
                "Slow request detected: %s %s took %s",
                request.method,
                request.url.path,
                formatted_time,
            )

        return response
