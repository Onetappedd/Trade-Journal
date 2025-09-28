# API Reference

Complete reference for all API endpoints in the Riskr trading analytics platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Trades API](#trades-api)
3. [KPI API](#kpi-api)
4. [Import API](#import-api)
5. [Subscription API](#subscription-api)
6. [Webhook API](#webhook-api)
7. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require authentication via Bearer token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### Token Validation

The server validates tokens using Supabase Auth:

```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json(
    createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized'),
    { status: 401 }
  );
}
```

---

## Trades API

### GET /api/trades

Retrieve trades with server-side filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-based) |
| `limit` | number | 50 | Items per page (max 100) |
| `sort` | string | 'opened_at' | Sort field |
| `direction` | string | 'desc' | Sort direction ('asc' or 'desc') |
| `symbol` | string | - | Filter by symbol (partial match) |
| `side` | string | - | Filter by side ('BUY' or 'SELL') |
| `status` | string | - | Filter by status ('open' or 'closed') |
| `asset_type` | string | - | Filter by asset type |
| `date_from` | string | - | Filter from date (ISO) |
| `date_to` | string | - | Filter to date (ISO) |

#### Example Request

```http
GET /api/trades?page=1&limit=50&sort=opened_at&direction=desc&symbol=AAPL&status=closed
Authorization: Bearer <token>
```

#### Response

```json
{
  "data": {
    "trades": [
      {
        "id": "uuid",
        "symbol": "AAPL",
        "side": "BUY",
        "quantity": 100,
        "price": 150.00,
        "pnl": 500.00,
        "opened_at": "2024-01-01T00:00:00Z",
        "closed_at": "2024-01-02T00:00:00Z",
        "status": "closed",
        "asset_type": "equity"
      }
    ],
    "totalCount": 1000,
    "page": 1,
    "limit": 50,
    "totalPages": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "success": true
}
```

### POST /api/trades

Create a new trade.

#### Request Body

```json
{
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 100,
  "price": 150.00,
  "asset_type": "equity"
}
```

#### Response

```json
{
  "data": {
    "id": "uuid",
    "symbol": "AAPL",
    "side": "BUY",
    "quantity": 100,
    "price": 150.00,
    "status": "open",
    "opened_at": "2024-01-01T00:00:00Z"
  },
  "success": true
}
```

---

## KPI API

### GET /api/kpi/summary

Get comprehensive KPI data calculated server-side.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 'all' | Time period ('all', 'ytd', 'mtd', '30d', '90d', '1y') |
| `assetType` | string | 'all' | Asset type filter |
| `symbol` | string | - | Symbol filter |

#### Example Request

```http
GET /api/kpi/summary?period=ytd&assetType=equity
Authorization: Bearer <token>
```

#### Response

```json
{
  "data": {
    "totalPnl": 5000.00,
    "winRate": 75.5,
    "totalTrades": 100,
    "sharpe": 1.25,
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    },
    "realizedPnl": 4500.00,
    "unrealizedPnl": 500.00,
    "maxDrawdown": 1000.00,
    "profitFactor": 1.8,
    "avgWin": 250.00,
    "avgLoss": -150.00,
    "totalVolume": 100000.00,
    "lastUpdated": "2024-01-01T00:00:00Z",
    "calculationMethod": "server"
  },
  "success": true
}
```

---

## Import API

### POST /api/import/csv

Import trades from CSV file with streaming processing and idempotency.

#### Request

```http
POST /api/import/csv
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <csv_file>
```

#### Response

```json
{
  "data": {
    "importRunId": "uuid",
    "status": "queued",
    "message": "Import started successfully"
  },
  "success": true
}
```

#### Import Status

Check import status using the returned `importRunId`:

```http
GET /api/import/runs/{importRunId}
Authorization: Bearer <token>
```

#### Response

```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "totalRows": 1000,
    "processedRows": 1000,
    "successfulRows": 950,
    "failedRows": 50,
    "progress": 100,
    "result": {
      "inserted": 950,
      "skipped": 0,
      "errors": 50
    }
  },
  "success": true
}
```

---

## Subscription API

### GET /api/me/subscription

Get user's subscription status and entitlements.

#### Response

```json
{
  "data": {
    "entitled": true,
    "tier": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-12-31T23:59:59Z",
    "cancelAtPeriodEnd": false,
    "features": [
      "unlimited_trades",
      "unlimited_imports",
      "advanced_analytics",
      "custom_reports",
      "api_access",
      "priority_support",
      "data_export",
      "real_time_data"
    ],
    "limits": {
      "maxTrades": -1,
      "maxImports": -1,
      "maxStorage": 10737418240
    }
  },
  "success": true
}
```

### POST /api/me/subscription

Update subscription status (internal use).

#### Request Body

```json
{
  "userId": "uuid",
  "subscriptionData": {
    "tier": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-12-31T23:59:59Z"
  }
}
```

---

## Webhook API

### POST /api/webhooks/stripe

Handle Stripe webhook events for subscription management.

#### Request

```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: <webhook_signature>

{
  "id": "evt_1234567890",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "customer": "cus_1234567890",
      "status": "active",
      "current_period_end": 1704067200
    }
  }
}
```

#### Supported Events

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

#### Response

```json
{
  "received": true
}
```

---

## Error Handling

All API endpoints return standardized error responses.

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `NETWORK_ERROR` | 502 | Network/connection error |

### Example Error Responses

#### Authentication Error

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authorization token provided",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": "symbol, side, quantity, and price are required",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to fetch trades",
    "details": "Database connection timeout",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Import endpoints**: 10 requests per minute
- **Webhook endpoints**: 1000 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Caching

API responses are cached for performance:

- **Trades data**: 1 minute cache
- **KPI data**: 5 minute cache
- **Subscription data**: 1 minute cache
- **Static data**: 1 hour cache

Cache invalidation occurs automatically on data changes.

---

## Testing

### Test Endpoints

For development and testing, additional endpoints are available:

- `GET /api/test/session` - Get current session info
- `GET /api/test/flags` - Get feature flags
- `POST /api/test/cleanup` - Clean up test data

### Example Test Request

```http
GET /api/test/session
Authorization: Bearer <token>
```

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com"
    },
    "session": {
      "expires_at": "2024-01-01T00:00:00Z"
    }
  },
  "success": true
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch trades with filtering
const response = await fetch('/api/trades?symbol=AAPL&status=closed', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log(data.data.trades);
} else {
  console.error(data.error.message);
}
```

### Python

```python
import requests

# Get KPI data
response = requests.get(
    'https://api.example.com/api/kpi/summary',
    headers={'Authorization': f'Bearer {token}'}
)

data = response.json()
if data['success']:
    print(f"Total P&L: {data['data']['totalPnl']}")
else:
    print(f"Error: {data['error']['message']}")
```

### cURL

```bash
# Import CSV file
curl -X POST https://api.example.com/api/import/csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@trades.csv"

# Get subscription status
curl -X GET https://api.example.com/api/me/subscription \
  -H "Authorization: Bearer $TOKEN"
```

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

