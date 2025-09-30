-- SQL Helper Function: Update Connection Last Sync Time
-- This is called when syncing accounts to bubble up the latest holdings sync time

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.set_connection_last_sync(uuid, uuid, timestamptz);

-- Create function to update connection's last_holdings_sync_at
CREATE OR REPLACE FUNCTION public.set_connection_last_sync(
  p_user_id uuid,
  p_auth_id uuid,
  p_sync_time timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the connection's last_holdings_sync_at to the provided sync time
  -- Only update if the new sync time is more recent than the current one
  UPDATE public.snaptrade_connections
  SET last_holdings_sync_at = GREATEST(
    COALESCE(last_holdings_sync_at, p_sync_time),
    p_sync_time
  )
  WHERE user_id = p_user_id
    AND authorization_id = p_auth_id;
END;
$$;

COMMENT ON FUNCTION public.set_connection_last_sync IS 
  'Updates connection last_holdings_sync_at to the latest account sync time. Called during account sync.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_connection_last_sync TO service_role;
