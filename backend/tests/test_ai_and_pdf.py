import pytest
from app.services.demo_planner import generate_demo_plan
from app.schemas import AIPlanSchema
from pydantic import ValidationError


def test_demo_planner_all_categories():
    categories = ["wedding", "birthday", "anniversary", "corporate", "college", "other"]
    for cat in categories:
        plan = generate_demo_plan({
            "name": f"Test {cat.capitalize()}",
            "category": cat,
            "budget_amount": 150000.0,
            "currency": "INR",
            "guest_count": 80,
            "location": "Bengaluru",
            "preferences": {"planning_style": "balanced"}
        })
        assert isinstance(plan, AIPlanSchema)
        assert len(plan.color_palette) >= 3
        assert len(plan.timeline) >= 5
        assert len(plan.budget_categories) >= 4
        assert len(plan.checklist) >= 5
        assert plan.event_concept != ""


def test_malformed_ai_plan_rejected():
    bad_data = {
        "event_concept": "Concept",
        "theme": "Theme",
        # Missing required fields like color_palette, timeline, etc.
        "timeline": "Not a list"  # Invalid type
    }
    with pytest.raises(ValidationError):
        AIPlanSchema(**bad_data)


def test_pdf_export_endpoint(client):
    # 1. Create event
    event_payload = {
        "name": "PDF Export Test Soiree",
        "category": "anniversary",
        "event_date": "2026-10-25",
        "location": "Heritage Villa",
        "guest_count": 40,
        "budget_amount": 90000.0,
        "currency": "INR"
    }
    res_event = client.post("/api/v1/events", json=event_payload)
    event_id = res_event.json()["id"]

    # 2. Add an expense and task
    client.post(f"/api/v1/events/{event_id}/expenses", json={
        "name": "Champagne Service",
        "category": "Catering",
        "estimated_amount": 15000.0,
        "actual_amount": 14500.0
    })
    client.post(f"/api/v1/events/{event_id}/tasks", json={
        "title": "Send RSVP invitations",
        "category": "Invites",
        "priority": "high",
        "completed": True
    })

    # 3. Call PDF export
    pdf_res = client.get(f"/api/v1/events/{event_id}/export-pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "attachment" in pdf_res.headers["content-disposition"]
    # Check PDF magic bytes '%PDF-'
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 1000  # Valid multi-page / contentful PDF
