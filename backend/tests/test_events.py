def test_create_event_valid(client):
    payload = {
        "name": "Sarah & Leo's Royal Wedding",
        "category": "wedding",
        "event_date": "2026-11-20",
        "location": "Udaipur Palace Grounds",
        "guest_count": 150,
        "budget_amount": 750000.0,
        "currency": "INR",
        "preferences": {
            "planning_style": "premium",
            "theme_colors": "Royal Crimson & Antique Gold"
        }
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sarah & Leo's Royal Wedding"
    assert data["category"] == "wedding"
    assert data["guest_count"] == 150
    assert data["budget_amount"] == 750000.0
    assert data["currency"] == "INR"
    assert data["plan_status"] == "completed"
    assert data["is_demo_plan"] is True  # Demo plan because no Gemini key configured in test
    assert data["plan_json"] is not None
    assert "event_concept" in data["plan_json"]


def test_create_event_invalid_whitespace_name(client):
    payload = {
        "name": "   ",
        "category": "birthday",
        "event_date": "2026-12-01",
        "location": "Downtown",
        "guest_count": 50,
        "budget_amount": 50000.0,
        "currency": "INR"
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 422


def test_create_event_invalid_currency(client):
    payload = {
        "name": "Tech Hackathon",
        "category": "corporate",
        "event_date": "2026-12-01",
        "location": "Downtown",
        "guest_count": 50,
        "budget_amount": 50000.0,
        "currency": "INVALID_XYZ"
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 422


def test_create_event_zero_or_negative_budget(client):
    payload = {
        "name": "Free Event",
        "category": "festival",
        "event_date": "2026-12-01",
        "location": "Park",
        "guest_count": 50,
        "budget_amount": -100.0,
        "currency": "INR"
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 422


def test_get_event(client):
    # Create first
    payload = {
        "name": "Milestone 30th Birthday",
        "category": "birthday",
        "event_date": "2026-08-15",
        "location": "Skyline Lounge",
        "guest_count": 60,
        "budget_amount": 120000.0,
        "currency": "INR"
    }
    res = client.post("/api/v1/events", json=payload)
    event_id = res.json()["id"]

    # Get
    res_get = client.get(f"/api/v1/events/{event_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == event_id
    assert res_get.json()["name"] == "Milestone 30th Birthday"


def test_get_nonexistent_event_returns_404(client):
    res = client.get("/api/v1/events/nonexistent-id-0000")
    assert res.status_code == 404


def test_update_event(client):
    payload = {
        "name": "Original Name",
        "category": "birthday",
        "event_date": "2026-08-15",
        "location": "Lounge",
        "guest_count": 30,
        "budget_amount": 50000.0,
        "currency": "INR"
    }
    res = client.post("/api/v1/events", json=payload)
    event_id = res.json()["id"]

    patch_payload = {
        "name": "Updated Name Gala",
        "guest_count": 45,
        "budget_amount": 75000.0
    }
    res_patch = client.patch(f"/api/v1/events/{event_id}", json=patch_payload)
    assert res_patch.status_code == 200
    assert res_patch.json()["name"] == "Updated Name Gala"
    assert res_patch.json()["guest_count"] == 45
    assert res_patch.json()["budget_amount"] == 75000.0


def test_delete_event(client):
    payload = {
        "name": "Temporary Event",
        "category": "other",
        "event_date": "2026-09-01",
        "location": "Community Center",
        "guest_count": 20,
        "budget_amount": 10000.0,
        "currency": "INR"
    }
    res = client.post("/api/v1/events", json=payload)
    event_id = res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/v1/events/{event_id}")
    assert del_res.status_code == 204

    # Verify 404 afterwards
    check_res = client.get(f"/api/v1/events/{event_id}")
    assert check_res.status_code == 404
