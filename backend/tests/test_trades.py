import pytest
from datetime import datetime, timedelta

@pytest.fixture
def auth_headers(client, user_data):
    client.post("/users/register", json=user_data)
    resp = client.post("/users/token", data={"username": user_data["username"], "password": user_data["password"]})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def strategy_id(client, auth_headers):
    resp = client.post("/strategies/", json={"name": "TestStrategy"}, headers=auth_headers)
    return resp.json()["id"]

def test_create_and_get_stock_trade(client, auth_headers, strategy_id):
    trade = {
        "strategy_id": strategy_id,
        "entry_date": datetime.utcnow().isoformat(),
        "entry_price": 100.0,
        "quantity": 10,
        "asset_type": "stock",
        "ticker": "AAPL"
    }
    resp = client.post("/trades/stock", json=trade, headers=auth_headers)
    assert resp.status_code == 200
    trade_id = resp.json()["id"]
    resp2 = client.get(f"/trades/{trade_id}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["asset_type"] == "stock"

def test_create_and_get_option_trade(client, auth_headers, strategy_id):
    trade = {
        "strategy_id": strategy_id,
        "entry_date": datetime.utcnow().isoformat(),
        "entry_price": 2.5,
        "quantity": 1,
        "asset_type": "option",
        "ticker": "AAPL",
        "option_type": "call",
        "strike": 150.0,
        "expiry": (datetime.utcnow() + timedelta(days=30)).isoformat()
    }
    resp = client.post("/trades/option", json=trade, headers=auth_headers)
    assert resp.status_code == 200
    trade_id = resp.json()["id"]
    resp2 = client.get(f"/trades/{trade_id}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["asset_type"] == "option"

def test_create_and_get_future_trade(client, auth_headers, strategy_id):
    trade = {
        "strategy_id": strategy_id,
        "entry_date": datetime.utcnow().isoformat(),
        "entry_price": 2000.0,
        "quantity": 1,
        "asset_type": "future",
        "contract": "ESM24",
        "expiry": (datetime.utcnow() + timedelta(days=60)).isoformat()
    }
    resp = client.post("/trades/future", json=trade, headers=auth_headers)
    assert resp.status_code == 200
    trade_id = resp.json()["id"]
    resp2 = client.get(f"/trades/{trade_id}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["asset_type"] == "future"
