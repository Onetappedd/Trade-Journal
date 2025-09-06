import { createClient } from '@/lib/supabase';
import { createWrappedApi } from '@/lib/errors';

export type UsageEventKind = 
  | 'csv_import' 
  | 'manual_refresh' 
  | 'analytics_query' 
  | 'snaptrade_refresh' 
  | 'heavy_analytics';

export interface UsageEventPayload {
  [key: string]: any;
}

/**
 * Emits a usage event to track user activity for Pro feature cost analysis
 * This should be called from service-side code (API routes) using service role
 */
export const emitUsageEvent = createWrappedApi(
  async (
    userId: string,
    kind: UsageEventKind,
    payload: UsageEventPayload = {}
  ): Promise<string | null> => {
    const supabase = createClient();
    
    // This function should be called from API routes with service role
    const { data, error } = await (supabase as any).rpc('emit_usage_event', {
      p_user_id: userId,
      p_kind: kind,
      p_payload: payload
    });

    if (error) {
      throw error;
    }

    return data;
  },
  'Failed to emit usage event'
);

/**
 * Gets current month usage summary for the authenticated user
 */
export const getUserUsageSummary = createWrappedApi(
  async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('get_user_usage_summary');
    
    if (error) {
      throw error;
    }

    return data || [];
  },
  'Failed to get usage summary'
);

/**
 * Gets usage summary for a specific date period with cost estimates
 */
export const getUserUsagePeriod = createWrappedApi(
  async (startDate: string, endDate: string) => {
    const supabase = createClient();
    
    const { data, error } = await (supabase as any).rpc('get_user_usage_period', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    
    if (error) {
      throw error;
    }

    return data || [];
  },
  'Failed to get usage period'
);

/**
 * Helper function to track CSV import completion
 */
export function trackCsvImport(userId: string, importId: string, rowCount: number) {
  return emitUsageEvent(userId, 'csv_import', {
    import_id: importId,
    row_count: rowCount,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to track manual refresh
 */
export function trackManualRefresh(userId: string, refreshType: string) {
  return emitUsageEvent(userId, 'manual_refresh', {
    refresh_type: refreshType,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to track analytics queries
 */
export function trackAnalyticsQuery(userId: string, queryType: string, complexity: 'light' | 'medium' | 'heavy') {
  const kind: UsageEventKind = complexity === 'heavy' ? 'heavy_analytics' : 'analytics_query';
  
  return emitUsageEvent(userId, kind, {
    query_type: queryType,
    complexity,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to track SnapTrade refresh
 */
export function trackSnapTradeRefresh(userId: string, accountId: string) {
  return emitUsageEvent(userId, 'snaptrade_refresh', {
    account_id: accountId,
    timestamp: new Date().toISOString()
  });
}
