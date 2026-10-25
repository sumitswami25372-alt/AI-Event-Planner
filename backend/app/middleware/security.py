"""
Security headers and content-size validation middleware.

Enforces:
- Defense-in-depth HTTP security headers (OWASP recommended)
- Request body payload size limits to mitigate resource exhaustion / denial of service
"""
from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.status import HTTP_413_CONTENT_TOO_LARGE

# Maximum allowed payload size in bytes (2 MB)
DEFAULT_MAX_BODY_SIZE = 2 * 1024 * 1024

# OWASP-recommended headers — pre-built as a tuple for zero allocation on
# each request (immutable at import time).
_SECURITY_HEADERS: tuple[tuple[str, str], ...] = (
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("X-XSS-Protection", "1; mode=block"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    (
        "Permissions-Policy",
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
        "magnetometer=(), microphone=(), payment=(), usb=()",
    ),
    (
        "Content-Security-Policy",
        "default-src 'self'; "
        "img-src 'self' data: blob:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "script-src 'self'; "
        "frame-ancestors 'none';",
    ),
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends OWASP-recommended HTTP security headers to every response.

    Headers are defined once at module load time as a module-level constant
    to avoid repeated string allocations on each request.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        for header_name, header_value in _SECURITY_HEADERS:
            response.headers[header_name] = header_value
        return response


class ContentSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Guards against denial of service via oversized HTTP request payloads.

    Checks the ``Content-Length`` header before the request body is read.
    Requests that declare a body larger than *max_body_size* bytes are
    rejected immediately with HTTP 413.
    """

    def __init__(self, app, max_body_size: int = DEFAULT_MAX_BODY_SIZE) -> None:
        super().__init__(app)
        self.max_body_size = max_body_size
        self._max_mb = max_body_size // (1024 * 1024)

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length_header = request.headers.get("content-length")
        if content_length_header:
            try:
                declared_length = int(content_length_header)
            except ValueError:
                declared_length = 0

            if declared_length > self.max_body_size:
                return JSONResponse(
                    status_code=HTTP_413_CONTENT_TOO_LARGE,
                    content={
                        "detail": (
                            f"Request body too large. "
                            f"Maximum allowed size is {self._max_mb}MB."
                        )
                    },
                )

        return await call_next(request)
