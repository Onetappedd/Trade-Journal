-- Test script for idempotency migration
-- This script tests the new columns and functionality

-- 1) Test that new columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND table_schema = 'public'
AND column_name IN ('idempotency_key', 'symbol_raw', 'meta', 'broker', 'external_id', 'asset_type', 'fees', 'commission', 'executed_at')
ORDER BY column_name;

-- 2) Test that indexes exist
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'trades' 
AND schemaname = 'public'
AND indexname LIKE '%idempotency%' OR indexname LIKE '%symbol_raw%' OR indexname LIKE '%broker%'
ORDER BY indexname;

-- 3) Test the idempotency key generation function
SELECT public.generate_idempotency_key(
    'webull',
    'order123',
    'TSLA250822C00325000',
    '2025-01-28T10:00:00Z'::timestamptz,
    'buy',
    150.50,
    100
) as generated_key;

-- 4) Test the function without external_id
SELECT public.generate_idempotency_key(
    'webull',
    NULL,
    'AAPL',
    '2025-01-28T10:00:00Z'::timestamptz,
    'buy',
    150.50,
    100
) as generated_key_no_external;

-- 5) Test that the view exists and works
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'trades_with_meta' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6) Test constraints exist
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.trades'::regclass
AND conname LIKE '%asset_type%' OR conname LIKE '%fees%' OR conname LIKE '%commission%';

-- 7) Test trigger exists
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'public.trades'::regclass
AND tgname = 'trigger_set_trade_idempotency_key';
