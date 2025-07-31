import pytest
from datetime import datetime, timedelta

@pytest.fixture
def setup_trades(client, auth_headers, strategy_id):
    # Win trade
    client.post("/trades/stock", json={
        "strategy_id": strategy_id,
        "entry_date": datetime.utcnow().isoformat(),
        "exit_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "entry_price": 100.0,
        "exit_price": 110.0,
        "quantity": 1,
        "asset_type": "stock",
        "ticker": "AAPL",
        "pnl": 10.0
    }, headers=auth_headers)
    # Loss trade
    client.post("/trades/stock", json={
        "strategy_id": strategy_id,
        "entry_date": datetime.utcnow().isoformat(),
        "exit_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "entry_price": 100.0,
        "exit_price": 90.0,
        "quantity": 1,
        "asset_type": "stock",
        "ticker": "AAPL",
        "pnl": -10.0
    }, headers=auth_headers)

def test_pnl(client, auth_headers, setup_trades):
    resp = client.get("/analytics/pnl", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_pnl"] == 0

def test_winrate(client, auth_headers, setup_trades):
    resp = client.get("/analytics/winrate", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["win_rate"] == 50.0
