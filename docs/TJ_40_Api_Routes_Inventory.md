# Trade-Journal API Routes Inventory

**Document Version**: 1.0  
**Last Updated**: 2025-01-18

---

## Classification Key

- **CORE**: Production-ready, used in user flows
- **EXPERIMENTAL**: Work in progress, partially wired
- **DEBUG**: Test/debug only, should be removed or gated

---

## Core API Routes

### Authentication & Users

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/user` | GET, PUT | CORE | Get/update current user profile |
| `/api/profiles/[id]` | GET, PUT | CORE | Get/update user profile by ID |
| `/api/username-check` | POST | CORE | Check username availability |

### Trades

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/trades` | GET, POST | CORE | List/create trades |
| `/api/trades/[id]` | GET, PUT, DELETE | CORE | Get/update/delete specific trade |
| `/api/actions/trades` | POST | CORE | Server action for trade operations |

### Import & Ingestion

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/import/csv` | POST | CORE | CSV import (bulletproof version) |
| `/api/import/manual` | POST | CORE | Manual trade entry |
| `/api/import/runs` | GET | CORE | List import runs |
| `/api/import/runs/[id]` | GET, DELETE | CORE | Get/delete specific import run |
| `/api/import/status` | GET | CORE | Check import status |
| `/api/import/resume` | POST | CORE | Resume failed import |
| `/api/import/rollback` | POST | CORE | Rollback import run |

### Analytics

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/analytics` | GET | CORE | Get user analytics |
| `/api/analytics/combined` | GET | CORE | Combined manual + broker analytics |
| `/api/analytics/performance` | GET | CORE | Performance metrics |
| `/api/kpi/summary` | GET | CORE | KPI summary |
| `/api/portfolio-value` | GET | CORE | Portfolio value timeline |
| `/api/calendar-realized` | GET | CORE | Calendar-based realized P&L |

### Broker Connections (SnapTrade)

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/snaptrade/register` | POST | CORE | Register user with SnapTrade |
| `/api/snaptrade/login-link` | GET | CORE | Get broker connection URL |
| `/api/snaptrade/connections` | GET | CORE | List broker connections |
| `/api/snaptrade/sync` | POST | CORE | Sync broker data |
| `/api/snaptrade/accounts` | GET | CORE | List broker accounts |
| `/api/snaptrade/positions` | GET | CORE | Get current positions |
| `/api/snaptrade/activities` | GET | CORE | Get trade activities |
| `/api/snaptrade/balances` | GET | CORE | Get account balances |
| `/api/snaptrade/orders` | GET | CORE | Get order history |
| `/api/snaptrade/webhook` | POST | CORE | Handle SnapTrade webhooks |
| `/api/snaptrade/verification` | GET | CORE | Check broker verification status |
| `/api/snaptrade/portal` | GET | CORE | Get SnapTrade portal URL |
| `/api/snaptrade/refresh` | POST | CORE | Force refresh broker data |

### Subscriptions & Billing

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/checkout` | POST | CORE | Create Stripe checkout session |
| `/api/portal` | POST | CORE | Get Stripe customer portal URL |
| `/api/stripe/webhook` | POST | CORE | Handle Stripe webhooks |
| `/api/me/subscription` | GET | CORE | Get current subscription status |

### Settings

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/settings/profile` | GET, PUT | CORE | Profile settings |
| `/api/settings/security` | PUT | CORE | Security settings (password change) |
| `/api/settings/data` | GET, DELETE | CORE | Data management (export, delete account) |

### Market Data

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/market/quote` | GET | CORE | Get real-time quote |
| `/api/market/search` | GET | CORE | Search symbols |
| `/api/market/chain` | GET | CORE | Options chain |
| `/api/market/snapshot` | GET | CORE | Market snapshot |
| `/api/market/trending` | GET | CORE | Trending stocks |
| `/api/market/batch-quotes` | POST | CORE | Batch quote lookup |
| `/api/polygon/*` | Various | CORE | Polygon.io proxy endpoints |

### Options Tools

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/options/scenarios` | POST | CORE | Calculate option scenarios |

### Miscellaneous

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/tags` | GET, POST | CORE | List/create trade tags |
| `/api/tags/[id]` | PUT, DELETE | CORE | Update/delete tag |
| `/api/notifications` | GET | CORE | Get user notifications |
| `/api/export` | GET | CORE | Export trades to CSV |
| `/api/health` | GET | CORE | Health check endpoint |

---

## Experimental/WIP Routes

| Path | Methods | Classification | Purpose | Status |
|------|---------|---------------|---------|--------|
| `/api/import/csv-webull*` | POST | EXPERIMENTAL | Webull-specific import variants | Multiple versions exist, consolidate |
| `/api/import/csv-fixed` | POST | EXPERIMENTAL | Fixed CSV import | Superseded by main `/csv` endpoint |
| `/api/import/presets` | GET | EXPERIMENTAL | Import presets | Table exists, API incomplete |
| `/api/matching/*` | Various | EXPERIMENTAL | Trade matching engine | Partially implemented |
| `/api/corporate-actions/sync` | POST | EXPERIMENTAL | Sync corporate actions | Not fully wired |
| `/api/scanner/*` | Various | EXPERIMENTAL | Market scanner | Partially implemented |
| `/api/portfolio/*` | Various | EXPERIMENTAL | Portfolio analytics | Some endpoints incomplete |

---

## Debug/Test Routes

| Path | Methods | Classification | Purpose | Recommendation |
|------|---------|---------------|---------|----------------|
| `/api/test-*` | Various | DEBUG | Various test endpoints | Remove or gate behind feature flag |
| `/api/debug-*` | Various | DEBUG | Debug endpoints | Remove or gate |
| `/api/check-*` | Various | DEBUG | Check/validate endpoints | Some useful, gate rest |

**Specific Debug Routes**:
- `/api/test-env`
- `/api/test-db`
- `/api/test-supabase`
- `/api/test-basic-insert`
- `/api/test-trade-insert`
- `/api/test-user`
- `/api/test-dashboard`
- `/api/test-features`
- `/api/debug-csv-parsing`
- `/api/debug-trades`
- `/api/debug-calendar`
- `/api/debug-import`
- `/api/debug-webull-csv`
- `/api/check-import-runs-table`
- `/api/check-trades-schema`

---

## Admin Routes

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/admin/instruments/merge` | POST | CORE | Merge duplicate instruments (admin only) |
| `/api/admin/maintenance` | POST | CORE | Run maintenance tasks (admin only) |

---

## Cron/Scheduled Routes

| Path | Methods | Classification | Purpose |
|------|---------|---------------|---------|
| `/api/cron/snapshots` | POST | CORE | Daily account snapshots (triggered by cron) |
| `/api/update-expired-options` | POST | CORE | Mark expired options as closed |
| `/api/update-trade-status` | POST | CORE | Update trade statuses |

---

## Summary Statistics

- **Total API Routes**: ~128 files in `app/api/`
- **Core (Production)**: ~85
- **Experimental**: ~20
- **Debug/Test**: ~23

---

## Recommendations

1. **Remove Debug Routes** or gate behind `NEXT_PUBLIC_E2E_TEST` env var
2. **Consolidate Experimental Routes**: Many import variants should be merged
3. **Document Missing Routes**: Some endpoints mentioned in code but not documented
4. **Add Rate Limiting**: Core endpoints should have rate limiting (especially imports, exports)
5. **API Versioning**: Consider `/api/v1/*` structure for future versioning

---

**End of Document**

