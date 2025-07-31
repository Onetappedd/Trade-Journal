import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def user_data():
    return {"username": "testuser", "email": "test@example.com", "password": "testpass123"}

def test_register_and_login(client, user_data):
    # Register
    resp = client.post("/users/register", json=user_data)
    assert resp.status_code == 200
    assert resp.json()["username"] == user_data["username"]
    # Duplicate registration
    resp2 = client.post("/users/register", json=user_data)
    assert resp2.status_code == 400
    # Login
    resp3 = client.post("/users/token", data={"username": user_data["username"], "password": user_data["password"]})
    assert resp3.status_code == 200
    token = resp3.json()["access_token"]
    assert token
    # Wrong password
    resp4 = client.post("/users/token", data={"username": user_data["username"], "password": "wrongpass"})
    assert resp4.status_code == 401

def test_protected_endpoint_requires_auth(client):
    resp = client.get("/users/me")
    assert resp.status_code == 401

def test_protected_endpoint_with_auth(client, user_data):
    client.post("/users/register", json=user_data)
    resp = client.post("/users/token", data={"username": user_data["username"], "password": user_data["password"]})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp2 = client.get("/users/me", headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["username"] == user_data["username"]
