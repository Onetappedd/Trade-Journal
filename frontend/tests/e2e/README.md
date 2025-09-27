# E2E Test Environment Setup

This document describes the environment and data setup for E2E tests to ensure reliable and consistent test execution.

## Environment Variables

The following environment variables are required for E2E tests:

```bash
NEXT_PUBLIC_IMPORT_V2_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
E2E_TEST=true
NODE_ENV=test
```

## Test Fixtures

### CSV Test Data

- **`tests/fixtures/webull-small.csv`**: 10 rows of Webull-formatted trade data with 2 duplicates
- **`tests/fixtures/robinhood-small.csv`**: 10 rows of Robinhood-formatted trade data with 2 duplicates

Both fixtures include:
- 8-12 rows of realistic trade data
- 2 duplicate rows to test deduplication logic
- Proper formatting that matches the parsers

## Authentication

### Robust Login Function

The `login(page, { email, password })` function in `tests/e2e/utils/auth.ts`:

1. Navigates to `/auth/sign-in`
2. Waits for `networkidle` state
3. Fills email and password fields
4. Submits the form
5. Waits for redirect to `/dashboard` or user avatar visibility
6. Ensures network is idle after successful login

## Test User Management

### Seed Script

The `scripts/e2e.seed.ts` script:

1. Creates a test user with unique email (`e2e_user+{timestamp}@riskr.local`)
2. Creates corresponding profile in `public.profiles`
3. Returns JSON result to stdout with markers:
   ```
   SEED_RESULT_START
   {"email": "...", "password": "...", "userId": "..."}
   SEED_RESULT_END
   ```

### Seed Helper

The `tests/e2e/utils/seed-helper.ts` provides:

- `seedE2EUser()`: Spawns seed script and parses JSON output
- `seedE2EUserWithTempFile()`: Alternative method using temp file
- `readSeedResultFromTempFile()`: Reads seed data from temp file
- `teardownE2EUser(options)`: Cleans up test users

## Environment Validation

### Pre-Test Validation

The `tests/e2e/validate-env.js` script:

1. Checks all required environment variables
2. Sets `E2E_TEST=true` if not already set
3. Warns about missing or incorrect values
4. Exits with error if critical variables are missing

### Integration with Test Scripts

All E2E test scripts now include environment validation:

```json
{
  "test:e2e": "node tests/e2e/validate-env.js && playwright test",
  "test:e2e:ui": "node tests/e2e/validate-env.js && playwright test --ui",
  "test:e2e:headed": "node tests/e2e/validate-env.js && playwright test --headed"
}
```

## Usage Examples

### Running Tests

```bash
# Validate environment and run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e:import
```

### Manual User Management

```bash
# Create test user
npm run e2e:seed

# Clean up test user
npm run e2e:teardown -- --all
```

## Test Structure

### Import Tests

- Uses `webull-small.csv` and `robinhood-small.csv` fixtures
- Tests both manual mapping and preset detection
- Validates duplicate handling
- Includes feature flag guard for disabled import v2

### Settings Tests

- Tests profile updates, password changes, notifications
- Validates form persistence and API integration
- Includes comprehensive error handling

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Run `node tests/e2e/validate-env.js` to check
   - Ensure all required variables are set

2. **Authentication Failures**
   - Check that test users are properly seeded
   - Verify Supabase credentials are correct

3. **CSV Import Issues**
   - Ensure fixtures match parser expectations
   - Check that import v2 is enabled

4. **Network Timeouts**
   - Tests include `waitForLoadState('networkidle')`
   - Increase timeouts if needed for slow networks

### Debug Mode

Run tests with debug output:

```bash
DEBUG=pw:api npm run test:e2e:headed
```

## File Structure

```
tests/e2e/
├── fixtures/
│   ├── webull-small.csv
│   └── robinhood-small.csv
├── utils/
│   ├── auth.ts
│   ├── selectors.ts
│   └── seed-helper.ts
├── validate-env.js
├── test-env.js
├── import.spec.ts
├── settings.spec.ts
└── README.md
```

