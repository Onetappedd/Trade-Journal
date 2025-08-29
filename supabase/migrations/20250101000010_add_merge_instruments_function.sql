-- Create function to merge instruments in a transaction
CREATE OR REPLACE FUNCTION merge_instruments(
  p_source_id UUID,
  p_target_id UUID,
  p_admin_user_id UUID
) RETURNS TABLE(
  executions_updated BIGINT,
  aliases_moved BIGINT,
  source_deleted BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_executions_updated BIGINT := 0;
  v_aliases_moved BIGINT := 0;
  v_source_deleted BOOLEAN := FALSE;
BEGIN
  -- Start transaction
  BEGIN
    -- Update executions_normalized to point to target instrument
    UPDATE executions_normalized 
    SET instrument_id = p_target_id,
        updated_at = NOW()
    WHERE instrument_id = p_source_id;
    
    GET DIAGNOSTICS v_executions_updated = ROW_COUNT;
    
    -- Move aliases to target instrument, handling duplicates
    WITH moved_aliases AS (
      INSERT INTO instrument_aliases (instrument_id, alias_symbol, created_at)
      SELECT p_target_id, alias_symbol, NOW()
      FROM instrument_aliases
      WHERE instrument_id = p_source_id
        AND alias_symbol NOT IN (
          SELECT alias_symbol 
          FROM instrument_aliases 
          WHERE instrument_id = p_target_id
        )
      ON CONFLICT (instrument_id, alias_symbol) DO NOTHING
      RETURNING alias_symbol
    )
    SELECT COUNT(*) INTO v_aliases_moved FROM moved_aliases;
    
    -- Delete source instrument aliases
    DELETE FROM instrument_aliases WHERE instrument_id = p_source_id;
    
    -- Delete source instrument
    DELETE FROM instruments WHERE id = p_source_id;
    
    GET DIAGNOSTICS v_source_deleted = ROW_COUNT;
    
    -- Log the merge operation
    INSERT INTO admin_audit_log (
      admin_user_id,
      action,
      table_name,
      record_id,
      details,
      created_at
    ) VALUES (
      p_admin_user_id,
      'merge_instruments',
      'instruments',
      p_target_id,
      jsonb_build_object(
        'source_id', p_source_id,
        'target_id', p_target_id,
        'executions_updated', v_executions_updated,
        'aliases_moved', v_aliases_moved,
        'source_deleted', v_source_deleted
      ),
      NOW()
    );
    
    -- Return results
    RETURN QUERY SELECT v_executions_updated, v_aliases_moved, v_source_deleted > 0;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      RAISE EXCEPTION 'Merge failed: %', SQLERRM;
  END;
END;
$$;

-- Create admin audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for admin audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view audit log" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
