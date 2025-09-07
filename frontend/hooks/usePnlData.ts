'use client';

import { useMemo } from 'react';
import { filterDataByRange, type TimeRange } from '@/components/charts/RangeFilter';
import { useUrlParams } from '@/hooks/useUrlParams';
import { calculatePositions } from '@/lib/position-tracker-server';

export interface PnlDataPoint {
  date: string;
  value: number;
}

export interface PnlSummary {
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  change: number;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
}

export interface PnlDataResult {
  // Raw data
  allData: PnlDataPoint[];
  filteredData: PnlDataPoint[];
  
  // Mode and fallback info
  mode: 'realized' | 'total';
  fallbackUsed: boolean;
  
  // Summary statistics
  summary: PnlSummary;
  
  // Counts for UI
  totalDataPoints: number;
  filteredDataPoints: number;
  
  // Current range
  currentRange: TimeRange;
}

// Generic trade interface that works with both Dashboard and Analytics
export interface GenericTrade {
  id: string;
  symbol: string;
  status: string;
  qty_opened: number;
  avg_open_price: number;
  opened_at: string;
  avg_close_price?: number | null;
  closed_at?: string | null;
  instrument_type?: string;
  multiplier?: number | null;
  underlying?: string | null;
  option_type?: string | null;
  strike_price?: number | null;
  expiration_date?: string | null;
  fees?: number | null;
  pnl?: number | null;
  mark_price?: number | null;
  last_price?: number | null;
}

// Build cumulative P&L series from trades using position tracker
function buildPnlSeries(trades: GenericTrade[]): { series: PnlDataPoint[], mode: 'realized' | 'total', fallbackUsed: boolean } {
  if (!trades || trades.length === 0) return { series: [], mode: 'realized', fallbackUsed: false };

  // Use the same position tracker logic as dashboard metrics
  const { closedTrades, stats } = calculatePositions(trades as any);

  // Build series from closed trades with pre-calculated P&L
  const series = buildSeriesFromClosedTrades(closedTrades);
  
  if (series.length > 0) {
    return { series, mode: 'realized', fallbackUsed: false };
  }

  // No P&L data available
  return { series: [], mode: 'realized', fallbackUsed: false };
}

// Helper function to build series from closed trades with pre-calculated P&L
function buildSeriesFromClosedTrades(closedTrades: Array<any & { pnl: number }>): PnlDataPoint[] {
  if (closedTrades.length === 0) return [];

  // Sort by exit date
  const sortedTrades = closedTrades.sort((a, b) => {
    const dateA = new Date(a.exit_date || a.entry_date);
    const dateB = new Date(b.exit_date || b.entry_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Group trades by date and calculate daily P&L
  const dailyPnl = new Map<string, number>();
  
  sortedTrades.forEach(trade => {
    const date = (trade.exit_date || trade.entry_date).split('T')[0]; // Get just the date part
    const pnl = trade.pnl || 0;
    const currentDailyPnl = dailyPnl.get(date) || 0;
    dailyPnl.set(date, currentDailyPnl + pnl);
  });

  // Convert to cumulative series with strict ascending order
  let cumulativePnl = 0;
  const series: PnlDataPoint[] = [];

  // Sort dates and ensure at least one point if we have any P&L
  const sortedDates = Array.from(dailyPnl.keys()).sort((a, b) => a.localeCompare(b));
  
  sortedDates.forEach(date => {
    const dailyPnlValue = dailyPnl.get(date) || 0;
    cumulativePnl += dailyPnlValue;
    series.push({
      date,
      value: cumulativePnl,
    });
  });

  // Ensure we return at least one point if there's any realized P&L
  if (series.length === 0) {
    const totalRealizedPnl = sortedTrades.reduce((sum, trade) => {
      return sum + (trade.pnl || 0);
    }, 0);
    
    if (totalRealizedPnl !== 0) {
      const lastTrade = sortedTrades[sortedTrades.length - 1];
      const lastDate = (lastTrade.exit_date || lastTrade.entry_date).split('T')[0];
      series.push({
        date: lastDate,
        value: totalRealizedPnl,
      });
    }
  }

  return series;
}

// Calculate comprehensive summary statistics using position tracker
function calculatePnlSummary(trades: GenericTrade[], filteredData: PnlDataPoint[]): PnlSummary {
  // Use the same position tracker logic as dashboard metrics
  const { closedTrades, stats } = calculatePositions(trades as any);
  
  // Use pre-calculated P&L from position tracker
  const realizedPnl = stats.totalPnL;
  const unrealizedPnl = 0; // Set to 0 until we have real-time prices

  const totalPnl = realizedPnl + unrealizedPnl;

  // Calculate change from filtered data
  const change = (() => {
    if (filteredData.length === 0) return 0;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's P&L value
    const todayDataPoint = filteredData.find(d => d.date === today);
    const yesterdayDataPoint = filteredData.find(d => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return d.date === yesterday.toISOString().split('T')[0];
    });
    
    if (todayDataPoint && yesterdayDataPoint) {
      // Today's change = today's P&L - yesterday's P&L
      return todayDataPoint.value - yesterdayDataPoint.value;
    } else if (todayDataPoint) {
      // If we only have today's data, return today's total P&L
      return todayDataPoint.value;
    } else if (filteredData.length > 1) {
      // Fallback: use the last two data points
      return filteredData[filteredData.length - 1].value - filteredData[filteredData.length - 2].value;
    } else if (filteredData.length === 1) {
      // If only one data point, return that value
      return filteredData[0].value;
    }
    
    return 0;
  })();

  // Count trades
  const closedTradesCount = closedTrades.length;
  const openTradesCount = trades.length - closedTradesCount;

  return {
    totalPnl,
    realizedPnl,
    unrealizedPnl,
    change,
    totalTrades: trades.length,
    closedTrades: closedTradesCount,
    openTrades: openTradesCount,
  };
}

export function usePnlData(trades: GenericTrade[]): PnlDataResult {
  // Get the current range from URL params
  const urlParams = useUrlParams();
  const currentRange = (urlParams.get('range') as TimeRange) || 'ALL';

  // Build P&L series using position tracker
  const pnlResult = useMemo(() => buildPnlSeries(trades), [trades]);
  const { series: allData, mode, fallbackUsed } = pnlResult;

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    // Use the most recent data point as reference date
    const referenceDate = allData.length > 0 
      ? new Date(allData[allData.length - 1].date) 
      : new Date();
    
    return filterDataByRange(allData, currentRange, referenceDate);
  }, [allData, currentRange]);

  // Calculate summary statistics using position tracker
  const summary = useMemo(() => {
    return calculatePnlSummary(trades, filteredData);
  }, [trades, filteredData]);

  return {
    allData,
    filteredData,
    mode,
    fallbackUsed,
    summary,
    totalDataPoints: allData.length,
    filteredDataPoints: filteredData.length,
    currentRange,
  };
}
