-- Test idempotency functionality
-- This script tests that re-imports are properly deduplicated

-- 1) Create test data to simulate Webull import
INSERT INTO public.trades (
    user_id,
    symbol,
    symbol_raw,
    side,
    quantity,
    entry_price,
    entry_date,
    broker,
    external_id,
    asset_type,
    fees,
    commission,
    executed_at,
    meta
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Test user ID
    'AAPL',
    'AAPL',
    'buy',
    100,
    150.50,
    '2025-01-28',
    'webull',
    'order123',
    'equity',
    1.00,
    0.00,
    '2025-01-28T10:00:00Z'::timestamptz,
    '{"rowIndex": 1, "source": "webull-csv", "originalPrice": "150.50"}'::jsonb
);

-- 2) Test that idempotency_key was generated
SELECT 
    id,
    symbol,
    symbol_raw,
    broker,
    external_id,
    idempotency_key,
    meta
FROM public.trades 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
AND symbol = 'AAPL';

-- 3) Try to insert the same trade again (should be prevented by unique constraint)
-- This will fail if the unique constraint is working
INSERT INTO public.trades (
    user_id,
    symbol,
    symbol_raw,
    side,
    quantity,
    entry_price,
    entry_date,
    broker,
    external_id,
    asset_type,
    fees,
    commission,
    executed_at,
    meta
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'AAPL',
    'AAPL',
    'buy',
    100,
    150.50,
    '2025-01-28',
    'webull',
    'order123',
    'equity',
    1.00,
    0.00,
    '2025-01-28T10:00:00Z'::timestamptz,
    '{"rowIndex": 1, "source": "webull-csv", "originalPrice": "150.50"}'::jsonb
);

-- 4) Test option symbol handling
INSERT INTO public.trades (
    user_id,
    symbol,
    symbol_raw,
    side,
    quantity,
    entry_price,
    entry_date,
    broker,
    external_id,
    asset_type,
    fees,
    commission,
    executed_at,
    meta
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'TSLA 2025-08-22 325C',
    'TSLA250822C00325000',
    'buy',
    1,
    5.50,
    '2025-01-28',
    'webull',
    'order456',
    'option',
    0.65,
    0.00,
    '2025-01-28T10:05:00Z'::timestamptz,
    '{"rowIndex": 2, "source": "webull-csv", "originalPrice": "5.50"}'::jsonb
);

-- 5) Test that different users can have the same external_id
INSERT INTO public.trades (
    user_id,
    symbol,
    symbol_raw,
    side,
    quantity,
    entry_price,
    entry_date,
    broker,
    external_id,
    asset_type,
    fees,
    commission,
    executed_at,
    meta
) VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid, -- Different user
    'AAPL',
    'AAPL',
    'buy',
    100,
    150.50,
    '2025-01-28',
    'webull',
    'order123', -- Same external_id as user 1
    'equity',
    1.00,
    0.00,
    '2025-01-28T10:00:00Z'::timestamptz,
    '{"rowIndex": 1, "source": "webull-csv", "originalPrice": "150.50"}'::jsonb
);

-- 6) Verify both users can have the same external_id
SELECT 
    user_id,
    symbol,
    external_id,
    idempotency_key
FROM public.trades 
WHERE external_id = 'order123'
ORDER BY user_id;

-- 7) Test the trades_with_meta view
SELECT 
    id,
    symbol,
    symbol_raw,
    broker,
    row_index,
    import_source,
    original_price
FROM public.trades_with_meta 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY executed_at;

-- 8) Clean up test data
DELETE FROM public.trades 
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
);


