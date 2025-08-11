import os
import base64
from typing import Any, Dict, List, Optional, Tuple
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
if SUPABASE_URL and SUPABASE_URL.endswith("/"):
    SUPABASE_URL = SUPABASE_URL[:-1]

REST_URL = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else None

class SupabaseRestError(Exception):
    pass

# ---------- Import helpers ----------

def _rest_url(table: str) -> str:
    if not REST_URL:
        raise SupabaseRestError("SUPABASE_URL not configured")
    return f"{REST_URL}/{table}"


def get_account_id_by_external(user_jwt: str, user_id: str, broker_id: str, account_external: str) -> str | None:
    if not REST_URL:
        return None
    url = _rest_url("account_external_map")
    params = {
        "select": "account_id",
        "user_id": f"eq.{user_id}",
        "broker_id": f"eq.{broker_id}",
        "account_external": f"eq.{account_external}",
    }
    r = requests.get(url, headers=_auth_headers(user_jwt), params=params, timeout=30)
    if r.status_code >= 400:
        return None
    rows = r.json()
    if rows:
        return rows[0].get("account_id")
    return None


def get_existing_dedupe_hashes(user_jwt: str, user_id: str, hashes: list[str]) -> set[str]:
    if not REST_URL or not hashes:
        return set()
    url = _rest_url("executions_staging")
    found: set[str] = set()
    headers = _auth_headers(user_jwt)
    # Chunk to avoid URL length limits
    chunk = 200
    for i in range(0, len(hashes), chunk):
        sub = hashes[i:i+chunk]
        params = {
            "select": "dedupe_hash",
            "user_id": f"eq.{user_id}",
            "dedupe_hash": f"in.({','.join(sub)})",
        }
        r = requests.get(url, headers=headers, params=params, timeout=60)
        if r.status_code in (200, 206):
            for row in r.json():
                if row.get("dedupe_hash"):
                    found.add(row["dedupe_hash"])
    return found


def bulk_insert_executions_staging(user_jwt: str, rows: list[dict]) -> int:
    if not REST_URL or not rows:
        return 0
    url = _rest_url("executions_staging")
    headers = _auth_headers(user_jwt)
    headers.update({
        "Prefer": "return=minimal",
        "Content-Type": "application/json",
    })
    r = requests.post(url, headers=headers, json=rows, timeout=120)
    if r.status_code not in (201, 204):
        raise SupabaseRestError(f"Bulk insert failed: {r.status_code} {r.text}")
    return len(rows)


def upsert_import_job(user_jwt: str, job: dict) -> dict:
    if not REST_URL:
        return job
    url = _rest_url("import_jobs")
    headers = _auth_headers(user_jwt)
    headers.update({
        "Prefer": "return=representation",
        "Content-Type": "application/json",
    })
    r = requests.post(url, headers=headers, json=job, timeout=60)
    if r.status_code not in (201, 200):
        raise SupabaseRestError(f"Failed to create job: {r.status_code} {r.text}")
    data = r.json()
    return data[0] if isinstance(data, list) and data else data


def update_import_job(user_jwt: str, job_id: str, patch: dict) -> None:
    if not REST_URL:
        return
    url = _rest_url("import_jobs")
    headers = _auth_headers(user_jwt)
    headers.update({
        "Prefer": "return=minimal",
        "Content-Type": "application/json",
    })
    params = {"id": f"eq.{job_id}"}
    r = requests.patch(url, headers=headers, params=params, json=patch, timeout=60)
    if r.status_code not in (204, 200):
        raise SupabaseRestError(f"Failed to update job: {r.status_code} {r.text}")


def insert_import_errors(user_jwt: str, errors: list[dict]) -> None:
    if not REST_URL or not errors:
        return
    url = _rest_url("import_job_errors")
    headers = _auth_headers(user_jwt)
    headers.update({
        "Prefer": "return=minimal",
        "Content-Type": "application/json",
    })
    r = requests.post(url, headers=headers, json=errors, timeout=60)
    if r.status_code not in (201, 204):
        raise SupabaseRestError(f"Failed to insert errors: {r.status_code} {r.text}")


def _auth_headers(user_jwt: str) -> Dict[str, str]:
    return {
        "apikey": os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
        "Authorization": f"Bearer {user_jwt}",
    }


def fetch_user_settings(user_jwt: str, user_id: str) -> Optional[Dict[str, Any]]:
    if not REST_URL:
        return None
    url = f"{REST_URL}/user_settings"
    params = {
        "select": "*",
        "user_id": f"eq.{user_id}",
    }
    r = requests.get(url, headers=_auth_headers(user_jwt), params=params, timeout=30)
    if r.status_code >= 400:
        return None
    rows = r.json()
    if not rows:
        return None
    return rows[0]


def build_trades_params(filters: Dict[str, Any]) -> Dict[str, str]:
    params: Dict[str, str] = {"select": "*"}
    # Required user filter
    params["user_id"] = f"eq.{filters['userId']}"

    # accountIds if your schema supports it (accounts_id column). Skip if not applicable
    if filters.get("accountIds"):
        # PostgREST .in requires parentheses
        ids = ",".join(filters["accountIds"])  # assumes UUID strings; URL safe
        params["account_id"] = f"in.({ids})"

    # assetClasses mapping: ui uses plural; DB asset_type uses singular values
    ac = filters.get("assetClasses")
    if ac:
        mapping = {"stocks": "stock", "options": "option", "futures": "futures"}
        mapped = [mapping.get(x, x) for x in ac]
        params["asset_type"] = f"in.({','.join(mapped)})"

    # strategies filter (assume string column 'strategy' or JSON tags)
    if filters.get("strategies"):
        # Basic equality on a single strategy column; adjust if using tags array
        # Use 'in' set for multiple
        params["strategy"] = f"in.({','.join(filters['strategies'])})"

    # Date window on close/exit date for realized PnL
    start = filters.get("start")
    end = filters.get("end")
    if start and end:
        params["and"] = f"(exit_date.gte.{start},exit_date.lte.{end})"
    elif start:
        params["exit_date"] = f"gte.{start}"
    elif end:
        params["exit_date"] = f"lte.{end}"

    return params


def fetch_trades_paginated(user_jwt: str, filters: Dict[str, Any], limit: int = 1000, max_pages: int = 100) -> List[Dict[str, Any]]:
    if not REST_URL:
        return []
    url = f"{REST_URL}/trades"

    # Build params without date end, handle via headers 'Prefer' 'count=exact' and Range
    params = build_trades_params(filters)

    items: List[Dict[str, Any]] = []
    start = 0
    page = 0
    while page < max_pages:
        end = start + limit - 1
        headers = _auth_headers(user_jwt)
        headers.update({
            "Range": f"{start}-{end}",
            "Prefer": "count=exact",
        })
        r = requests.get(url, headers=headers, params=params, timeout=60)
        if r.status_code == 206 or r.status_code == 200:
            batch = r.json()
            if not batch:
                break
            items.extend(batch)
            if len(batch) < limit:
                break
            start += limit
            page += 1
        else:
            raise SupabaseRestError(f"Failed to fetch trades: {r.status_code} {r.text}")
    # Normalize keys
    for t in items:
        t.setdefault("fees", 0)
    return items


def fetch_cash_flows_paginated(user_jwt: str, filters: Dict[str, Any], limit: int = 1000, max_pages: int = 100) -> List[Dict[str, Any]]:
    """Fetch cash flows (deposits/withdrawals/fees) with pagination if table exists.
    Expected table: cash_flows with columns: user_id, account_id, amount, type, date or created_at.
    Returns empty list if REST_URL or table not available.
    """
    if not REST_URL:
        return []
    url = f"{REST_URL}/cash_flows"

    params: Dict[str, str] = {
        "select": "*",
        "user_id": f"eq.{filters['userId']}",
    }
    if filters.get("accountIds"):
        ids = ",".join(filters["accountIds"])  # assumes UUIDs
        params["account_id"] = f"in.({ids})"

    start = filters.get("start")
    end = filters.get("end")
    if start and end:
        params["and"] = f"(date.gte.{start},date.lte.{end})"
    elif start:
        params["date"] = f"gte.{start}"
    elif end:
        params["date"] = f"lte.{end}"

    items: List[Dict[str, Any]] = []
    start_idx = 0
    page = 0
    while page < max_pages:
        end_idx = start_idx + limit - 1
        headers = _auth_headers(user_jwt)
        headers.update({
            "Range": f"{start_idx}-{end_idx}",
            "Prefer": "count=exact",
        })
        r = requests.get(url, headers=headers, params=params, timeout=60)
        if r.status_code in (200, 206):
            batch = r.json()
            if not batch:
                break
            items.extend(batch)
            if len(batch) < limit:
                break
            start_idx += limit
            page += 1
        else:
            # If table doesn't exist or unauthorized, stop silently
            break

    return items


def encode_cursor(payload: Dict[str, Any]) -> str:
    raw = str(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def decode_cursor(cursor: str) -> Dict[str, Any]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
        # eval a dict-like string safely is complex; keep cursor simple like offset only
        return {}
    except Exception:
        return {}


def fetch_trades_page(user_jwt: str, filters: Dict[str, Any], limit: int, offset: int) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    if not REST_URL:
        return [], None
    url = f"{REST_URL}/trades"
    params = build_trades_params(filters)
    headers = _auth_headers(user_jwt)
    headers.update({
        "Range": f"{offset}-{offset + limit - 1}",
        "Prefer": "count=exact",
    })
    r = requests.get(url, headers=headers, params=params, timeout=60)
    if r.status_code not in (200, 206):
        raise SupabaseRestError(f"Failed to fetch trades: {r.status_code} {r.text}")
    batch = r.json()
    next_cursor = None
    if len(batch) == limit:
        next_cursor = encode_cursor({"o": offset + limit})
    return batch, next_cursor
