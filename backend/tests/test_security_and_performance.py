"""
Unit and integration tests for CelebrAI security, rate limiting, and performance middleware.
"""
from app.middleware.rate_limit import InMemoryRateLimiter


def test_security_headers_present(client):
    """Verify that OWASP-compliant defense-in-depth headers are present on all responses."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "default-src 'self'" in headers.get("content-security-policy", "")
    assert "camera=()" in headers.get("permissions-policy", "")


def test_process_time_header_present(client):
    """Verify that high-precision execution timing is measured and returned in response."""
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    assert "x-process-time" in response.headers
    assert response.headers["x-process-time"].endswith("ms")


def test_cache_control_headers(client):
    """Verify caching directives for static config vs dynamic health."""
    health_res = client.get("/api/v1/health")
    assert "no-cache" in health_res.headers.get("cache-control", "")

    config_res = client.get("/api/v1/config")
    assert "max-age=60" in config_res.headers.get("cache-control", "")


def test_in_memory_rate_limiter_logic():
    """Verify sliding-window rate limiter blocks requests above threshold."""
    limiter = InMemoryRateLimiter(window_seconds=60)
    test_ip = "192.168.1.100"

    # Allow up to 3 requests
    for i in range(3):
        allowed, rem, retry = limiter.is_allowed(test_ip, max_requests=3)
        assert allowed is True
        assert rem == 2 - i

    # 4th request must be denied
    allowed, rem, retry = limiter.is_allowed(test_ip, max_requests=3)
    assert allowed is False
    assert rem == 0
    assert retry > 0


def test_content_size_limit_middleware(client):
    """Verify oversized payloads are rejected with HTTP 413."""
    # Create a payload larger than 2MB
    huge_text = "x" * (2 * 1024 * 1024 + 100)
    headers = {"Content-Length": str(len(huge_text)), "Content-Type": "application/json"}
    response = client.post("/api/v1/events", content=huge_text, headers=headers)
    assert response.status_code == 413
    assert "Request body too large" in response.json()["detail"]
