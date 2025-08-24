import { getTrades } from '@/lib/trades';

export type EquityRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type EquityPoint = { t: string; v: number };

function getPeriodBounds(range: EquityRange) {
  const now = new Date();
  let from: Date;
  switch (range) {
    case '1D': from = new Date(now); from.setDate(now.getDate() - 1); break;
    case '1W': from = new Date(now); from.setDate(now.getDate() - 7); break;
    case '1M': from = new Date(now); from.setMonth(now.getMonth() - 1); break;
    case '3M': from = new Date(now); from.setMonth(now.getMonth() - 3); break;
    case '1Y': from = new Date(now); from.setFullYear(now.getFullYear() - 1); break;
    case 'ALL': default: from = new Date(2000, 0, 1); break;
  }
  return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

/**
 * getEquitySeries returns daily equity/account value points for the user, for analytics dashboard.
 * It MUST use the same logic as the normal dashboard equity/portfolio chart: starting value + cumulative closed PnL + mark open positions if needed.
 */
export async function getEquitySeries(userId: string, range: EquityRange): Promise<EquityPoint[]> {
  const { from, to } = getPeriodBounds(range);
  // Pull all trades for user in the range (+ buffer for prior trades)
  const startFrom = (range === 'ALL') ? undefined : from;
  const res = await getTrades({ userId, dateFrom: startFrom, dateTo: to, page: 1, pageSize: 2000 });
  const trades = res.items.sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));
  // Assume initial account value of 10,000 (or pull from user profile if available)
  let equity = 10000;
  const dateMap: Record<string, number> = {};
  for (const t of trades) {
    // Only apply realized PnL from closed trades
    if (t.status === 'closed' && t.exit_date) {
      const pnl = (typeof t.pnl === 'number') ? t.pnl : 0;
      equity += pnl;
      const dt = t.exit_date.slice(0, 10);
      dateMap[dt] = equity;
    }
  }
  // Build a series of daily points
  const points: EquityPoint[] = [];
  const pointer = new Date(startFrom || trades[0]?.entry_date || to);
  const end = new Date(to);
  let eq = 10000;
  while (pointer <= end) {
    const d = pointer.toISOString().slice(0, 10);
    if (d in dateMap) eq = dateMap[d];
    points.push({ t: d, v: eq });
    pointer.setDate(pointer.getDate() + 1);
  }
  return points;
}
