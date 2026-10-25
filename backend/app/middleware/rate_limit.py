"""
Thread-safe sliding-window rate limiting middleware for CelebrAI.

Protects backend APIs from abuse, credential stuffing, and expensive AI generation token exhaustion.
Returns HTTP 429 Too Many Requests with standard Retry-After and X-RateLimit-* headers.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class InMemoryRateLimiter:
    """Sliding-window request counter per client IP address."""

    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, client_ip: str, max_requests: int) -> Tuple[bool, int, int]:
        """
        Check if request is permitted.
        Returns:
            (allowed: bool, remaining: int, retry_after: int)
        """
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._requests[client_ip]
            # Prune timestamps outside current window
            while timestamps and timestamps[0] < cutoff:
                timestamps.pop(0)

            count = len(timestamps)
            if count >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(cutoff + self.window_seconds - earliest))
                return False, 0, retry_after

            timestamps.append(now)
            remaining = max_requests - len(timestamps)
            return True, remaining, 0

    def cleanup(self) -> None:
        """Periodically clean empty keys to prevent unbounded memory growth."""
        now = time.time()
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
    Applies sliding-window rate limits:
    - AI generation endpoints (/generate-plan): 20 req/min
    - General endpoints: 120 req/min
    """

    def __init__(
        self,
        app,
        default_limit: int = 120,
        ai_limit: int = 25,
        window_seconds: int = 60,
    ):
        super().__init__(app)
        self.default_limit = default_limit
        self.ai_limit = ai_limit
        self.limiter = InMemoryRateLimiter(window_seconds=window_seconds)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Don't rate limit docs or OpenAPI schema
        if request.url.path in ("/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        # Extract client IP (handle proxies if X-Forwarded-For present)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        # Determine limit based on endpoint sensitivity
        is_ai_endpoint = "generate-plan" in request.url.path
        limit = self.ai_limit if is_ai_endpoint else self.default_limit

        allowed, remaining, retry_after = self.limiter.is_allowed(client_ip, limit)

        if not allowed:
            response = JSONResponse(
                status_code=429,
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
