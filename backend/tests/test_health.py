def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data


def test_config_endpoint(client):
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    data = response.json()
    assert "INR" in data["supported_currencies"]
    assert data["demo_mode_available"] is True
