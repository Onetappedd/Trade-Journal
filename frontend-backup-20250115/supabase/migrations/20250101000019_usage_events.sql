-- Usage Events Migration
-- Tracks user activity for Pro feature cost analysis

-- Create usage_events table
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('csv_import', 'manual_refresh', 'analytics_query', 'snaptrade_refresh', 'heavy_analytics')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_kind ON public.usage_events(kind);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_kind_date ON public.usage_events(user_id, kind, created_at);

-- Enable RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own usage events
CREATE POLICY "Users can view own usage events" ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update/delete (for system events)
CREATE POLICY "Service role can manage usage events" ON public.usage_events
  FOR ALL USING (auth.role() = 'service_role');

-- Function to emit usage events (for use by service role)
CREATE OR REPLACE FUNCTION public.emit_usage_event(
  p_user_id UUID,
  p_kind TEXT,
  p_payload JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.usage_events (user_id, kind, payload)
  VALUES (p_user_id, p_kind, p_payload)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to get user usage summary for current month
CREATE OR REPLACE FUNCTION public.get_user_usage_summary(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  kind TEXT,
  count BIGINT,
  last_used TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    kind,
    COUNT(*) as count,
    MAX(created_at) as last_used
  FROM public.usage_events
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
  GROUP BY kind
  ORDER BY count DESC;
$$;

-- Function to get user usage for specific period
CREATE OR REPLACE FUNCTION public.get_user_usage_period(
  p_user_id UUID DEFAULT auth.uid(),
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  kind TEXT,
  count BIGINT,
  total_cost_estimate NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH usage_counts AS (
    SELECT 
      kind,
      COUNT(*) as count
    FROM public.usage_events
    WHERE user_id = p_user_id
      AND created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY kind
  )
  SELECT 
    kind,
    count,
    CASE 
      WHEN kind = 'csv_import' THEN count * 0.01  -- $0.01 per import
      WHEN kind = 'manual_refresh' THEN count * 0.005  -- $0.005 per refresh
      WHEN kind = 'analytics_query' THEN count * 0.001  -- $0.001 per query
      WHEN kind = 'snaptrade_refresh' THEN count * 0.02  -- $0.02 per refresh
      WHEN kind = 'heavy_analytics' THEN count * 0.05   -- $0.05 per heavy query
      ELSE 0
    END as total_cost_estimate
  FROM usage_counts
  ORDER BY total_cost_estimate DESC;
$$;

-- Comments
COMMENT ON TABLE public.usage_events IS 'Tracks user activity for Pro feature cost analysis';
COMMENT ON COLUMN public.usage_events.kind IS 'Type of usage event (csv_import, manual_refresh, analytics_query, etc.)';
COMMENT ON COLUMN public.usage_events.payload IS 'Additional event data in JSON format';
COMMENT ON FUNCTION public.emit_usage_event IS 'Emits a usage event for a user (service role only)';
COMMENT ON FUNCTION public.get_user_usage_summary IS 'Gets current month usage summary for authenticated user';
COMMENT ON FUNCTION public.get_user_usage_period IS 'Gets usage summary for specific date period with cost estimates';
