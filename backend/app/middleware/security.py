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

# Maximum allowed payload size in bytes (2 MB)
DEFAULT_MAX_BODY_SIZE = 2 * 1024 * 1024


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends standard OWASP-recommended HTTP security headers to all responses.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Standard defense-in-depth headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' data: https://fonts.gstatic.com; "
            "script-src 'self'; "
            "frame-ancestors 'none';"
        )
        return response


class ContentSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Guards against denial of service via oversized HTTP request payloads.
    """

    def __init__(self, app, max_body_size: int = DEFAULT_MAX_BODY_SIZE):
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length_int = int(content_length)
                if length_int > self.max_body_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request body too large. Maximum allowed size is {self.max_body_size // (1024 * 1024)}MB."
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)
