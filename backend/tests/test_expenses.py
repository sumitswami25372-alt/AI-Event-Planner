def test_expense_crud_and_budget_calculation(client):
    # 1. Create an event with 100,000 budget
    event_payload = {
        "name": "Budget Test Celebration",
        "category": "birthday",
        "event_date": "2026-10-10",
        "location": "Clubhouse",
        "guest_count": 50,
        "budget_amount": 100000.0,
        "currency": "INR"
    }
    res_event = client.post("/api/v1/events", json=event_payload)
    event_id = res_event.json()["id"]

    # 2. Add custom expense
    exp_payload = {
        "name": "Live Acoustic Band",
        "category": "Entertainment",
        "estimated_amount": 25000.0,
        "actual_amount": 22000.0,
        "notes": "Includes sound technician"
    }
    res_exp = client.post(f"/api/v1/events/{event_id}/expenses", json=exp_payload)
    assert res_exp.status_code == 201
    exp_id = res_exp.json()["id"]
    assert res_exp.json()["name"] == "Live Acoustic Band"
    assert res_exp.json()["estimated_amount"] == 25000.0
    assert res_exp.json()["actual_amount"] == 22000.0

    # 3. Fetch expenses and check budget summary
    res_list = client.get(f"/api/v1/events/{event_id}/expenses")
    assert res_list.status_code == 200
    data = res_list.json()
    assert "summary" in data
    summary = data["summary"]
    assert summary["budget_amount"] == 100000.0
    # Actual amount should include the 22000 plus any auto-populated expenses
    assert summary["actual_total"] >= 22000.0
    assert summary["remaining_budget"] == summary["budget_amount"] - summary["actual_total"]

    # 4. Patch expense
    res_patch = client.patch(f"/api/v1/expenses/{exp_id}", json={
        "actual_amount": 24000.0,
        "notes": "Negotiated sound fee included"
    })
    assert res_patch.status_code == 200
    assert res_patch.json()["actual_amount"] == 24000.0
    assert res_patch.json()["notes"] == "Negotiated sound fee included"

    # 5. Delete expense
    res_del = client.delete(f"/api/v1/expenses/{exp_id}")
    assert res_del.status_code == 204

    # 6. Verify deleting non-existent expense returns 404
    res_del_404 = client.delete(f"/api/v1/expenses/{exp_id}")
    assert res_del_404.status_code == 404


def test_add_expense_nonexistent_event_returns_404(client):
    payload = {
        "name": "Ghost Expense",
        "category": "Venue",
        "estimated_amount": 5000.0,
        "actual_amount": 0.0
    }
    res = client.post("/api/v1/events/nonexistent-event-id/expenses", json=payload)
    assert res.status_code == 404
