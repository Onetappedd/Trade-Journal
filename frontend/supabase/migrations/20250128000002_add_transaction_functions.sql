-- Migration: Add Transaction Management Functions
-- Description: Add functions to support transaction management for imports
-- Date: 2025-01-28

-- 1) Create function to begin a transaction
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS text AS $$
BEGIN
    -- This is a placeholder function for transaction management
    -- In practice, transactions are handled by the client
    RETURN 'Transaction started';
END;
$$ LANGUAGE plpgsql;

-- 2) Create function to commit a transaction
CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS text AS $$
BEGIN
    -- This is a placeholder function for transaction management
    -- In practice, transactions are handled by the client
    RETURN 'Transaction committed';
END;
$$ LANGUAGE plpgsql;

-- 3) Create function to rollback a transaction
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS text AS $$
BEGIN
    -- This is a placeholder function for transaction management
    -- In practice, transactions are handled by the client
    RETURN 'Transaction rolled back';
END;
$$ LANGUAGE plpgsql;

-- 4) Create function to batch insert trades with transaction support
CREATE OR REPLACE FUNCTION public.batch_insert_trades(
    p_trades jsonb,
    p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
    trade_record jsonb;
    inserted_count integer := 0;
    duplicate_count integer := 0;
    error_count integer := 0;
    result jsonb;
BEGIN
    -- Process each trade in the batch
    FOR trade_record IN SELECT * FROM jsonb_array_elements(p_trades)
    LOOP
        BEGIN
            -- Check if trade already exists (idempotency check)
            IF EXISTS (
                SELECT 1 FROM public.trades 
                WHERE user_id = p_user_id 
                AND idempotency_key = (trade_record->>'idempotency_key')
            ) THEN
                duplicate_count := duplicate_count + 1;
            ELSE
                -- Insert the trade
                INSERT INTO public.trades (
                    user_id,
                    broker,
                    external_id,
                    idempotency_key,
                    asset_type,
                    symbol,
                    symbol_raw,
                    side,
                    qty,
                    price,
                    fees,
                    commission,
                    executed_at,
                    meta
                ) VALUES (
                    p_user_id,
                    trade_record->>'broker',
                    trade_record->>'external_id',
                    trade_record->>'idempotency_key',
                    trade_record->>'asset_type',
                    trade_record->>'symbol',
                    trade_record->>'symbol_raw',
                    trade_record->>'side',
                    (trade_record->>'qty')::numeric,
                    (trade_record->>'price')::numeric,
                    (trade_record->>'fees')::numeric,
                    (trade_record->>'commission')::numeric,
                    (trade_record->>'executed_at')::timestamptz,
                    trade_record->'meta'
                );
                inserted_count := inserted_count + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                -- Log the error but continue processing
                RAISE WARNING 'Error inserting trade: %', SQLERRM;
        END;
    END LOOP;
    
    -- Return result summary
    result := jsonb_build_object(
        'inserted', inserted_count,
        'duplicatesSkipped', duplicate_count,
        'errors', error_count,
        'totalProcessed', jsonb_array_length(p_trades)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5) Create function to get import summary for error reporting
CREATE OR REPLACE FUNCTION public.get_import_summary(
    p_user_id uuid,
    p_file_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- This function can be extended to provide more detailed summaries
    -- For now, return a basic structure
    result := jsonb_build_object(
        'message', 'Import summary retrieved',
        'timestamp', now(),
        'user_id', p_user_id,
        'file_id', p_file_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6) Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.begin_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_insert_trades TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_import_summary TO authenticated;

-- 7) Add comments to document the functions
COMMENT ON FUNCTION public.begin_transaction IS 'Placeholder function for transaction management';
COMMENT ON FUNCTION public.commit_transaction IS 'Placeholder function for transaction management';
COMMENT ON FUNCTION public.rollback_transaction IS 'Placeholder function for transaction management';
COMMENT ON FUNCTION public.batch_insert_trades IS 'Batch insert trades with idempotency checking';
COMMENT ON FUNCTION public.get_import_summary IS 'Get import summary for error reporting';

