-- Function to delete import run with cascade cleanup
CREATE OR REPLACE FUNCTION delete_import_run_cascade(
  p_run_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Delete executions_normalized for this import run
  DELETE FROM executions_normalized 
  WHERE import_run_id = p_run_id 
    AND user_id = p_user_id;
  
  -- Delete raw_import_items for this import run
  DELETE FROM raw_import_items 
  WHERE import_run_id = p_run_id 
    AND user_id = p_user_id;
  
  -- Delete the import run itself
  DELETE FROM import_runs 
  WHERE id = p_run_id 
    AND user_id = p_user_id;
  
  -- Note: We don't delete from trades table here
  -- The calling code will handle trade rebuilding via matchUserTrades
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_import_run_cascade(UUID, UUID) TO authenticated;
