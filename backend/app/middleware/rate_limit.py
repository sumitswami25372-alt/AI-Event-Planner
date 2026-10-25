"""
Thread-safe sliding-window rate limiting middleware for CelebrAI.

Protects backend APIs from abuse, credential stuffing, and expensive AI
generation token exhaustion.

Returns HTTP 429 Too Many Requests with standard Retry-After and
X-RateLimit-* headers when the limit is exceeded.

Algorithmic note: timestamps are stored in a ``collections.deque`` so that
pruning expired entries from the left end is O(1) per removal, compared to
the O(n) cost of list.pop(0).
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.status import HTTP_429_TOO_MANY_REQUESTS


class InMemoryRateLimiter:
    """Sliding-window request counter per client IP address using a deque."""

    def __init__(self, window_seconds: int = 60) -> None:
        self.window_seconds = window_seconds
        # Deque gives O(1) popleft for pruning expired timestamps
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, client_ip: str, max_requests: int) -> tuple[bool, int, int]:
        """
        Check if request is permitted under the sliding window.

        Returns:
            ``(allowed, remaining, retry_after_seconds)``
        """
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._requests[client_ip]
            # Prune timestamps outside the current window (O(1) per removal)
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            count = len(timestamps)
            if count >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(cutoff + self.window_seconds - earliest))
                return False, 0, retry_after

            timestamps.append(now)
            remaining = max_requests - len(timestamps)
            return True, remaining, 0

    def cleanup(self) -> None:
        """Remove stale keys to prevent unbounded memory growth."""
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            empty_keys = [
                ip
                for ip, timestamps in self._requests.items()
                if not timestamps or timestamps[-1] < cutoff
            ]
            for ip in empty_keys:
                del self._requests[ip]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies per-IP sliding-window rate limits:

    - AI generation endpoints (``/generate-plan``): ``ai_limit`` req/min
    - All other endpoints: ``default_limit`` req/min

    Adds ``X-RateLimit-Limit`` and ``X-RateLimit-Remaining`` headers to every
    response for client-side back-pressure support.
    """

    # Paths that should never be rate-limited
    _EXEMPT_PATHS: frozenset[str] = frozenset({"/docs", "/redoc", "/openapi.json"})

    def __init__(
        self,
        app,
        default_limit: int = 120,
        ai_limit: int = 25,
        window_seconds: int = 60,
    ) -> None:
        super().__init__(app)
        self.default_limit = default_limit
        self.ai_limit = ai_limit
        self.limiter = InMemoryRateLimiter(window_seconds=window_seconds)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Extract the real client IP, respecting X-Forwarded-For proxies."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self._EXEMPT_PATHS:
            return await call_next(request)

        client_ip = self._get_client_ip(request)

        # Tighter limit for expensive AI generation endpoints
        is_ai_endpoint = "generate-plan" in request.url.path
        limit = self.ai_limit if is_ai_endpoint else self.default_limit

        allowed, remaining, retry_after = self.limiter.is_allowed(client_ip, limit)

        if not allowed:
            response: Response = JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please wait before making more requests."
                },
            )
            response.headers["Retry-After"] = str(retry_after)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = "0"
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
