def test_task_crud_and_completion_tracking(client):
    # 1. Create event
    event_payload = {
        "name": "Checklist Test Gala",
        "category": "corporate",
        "event_date": "2026-11-15",
        "location": "Convention Center",
        "guest_count": 100,
        "budget_amount": 200000.0,
        "currency": "INR"
    }
    res_event = client.post("/api/v1/events", json=event_payload)
    event_id = res_event.json()["id"]

    # 2. Add task
    task_payload = {
        "title": "Book Keynote Speaker",
        "category": "Program",
        "priority": "high",
        "due_date": "14 days before event",
        "completed": False
    }
    res_task = client.post(f"/api/v1/events/{event_id}/tasks", json=task_payload)
    assert res_task.status_code == 201
    task_id = res_task.json()["id"]
    assert res_task.json()["title"] == "Book Keynote Speaker"
    assert res_task.json()["completed"] is False

    # 3. Patch task to completed
    res_patch = client.patch(f"/api/v1/tasks/{task_id}", json={"completed": True})
    assert res_patch.status_code == 200
    assert res_patch.json()["completed"] is True

    # 4. Check tasks list
    res_list = client.get(f"/api/v1/events/{event_id}/tasks")
    assert res_list.status_code == 200
    tasks = res_list.json()
    assert any(t["id"] == task_id and t["completed"] is True for t in tasks)

    # 5. Delete task
    res_del = client.delete(f"/api/v1/tasks/{task_id}")
    assert res_del.status_code == 204

    # 6. Delete nonexistent task returns 404
    res_del_404 = client.delete(f"/api/v1/tasks/{task_id}")
    assert res_del_404.status_code == 404


def test_invalid_task_priority(client):
    event_payload = {
        "name": "Priority Test Event",
        "category": "birthday",
        "event_date": "2026-11-15",
        "location": "Hall",
        "guest_count": 25,
        "budget_amount": 30000.0,
        "currency": "INR"
    }
    res_event = client.post("/api/v1/events", json=event_payload)
    event_id = res_event.json()["id"]

    bad_task = {
        "title": "Invalid Priority Task",
        "priority": "ultra-urgent"  # Only low, medium, high allowed
    }
    res = client.post(f"/api/v1/events/{event_id}/tasks", json=bad_task)
    assert res.status_code == 422
