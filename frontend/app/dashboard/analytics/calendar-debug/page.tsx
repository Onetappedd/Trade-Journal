import { getUserTradesGroupedByDay } from '@/lib/calendar-metrics-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculatePositions } from '@/lib/position-tracker-server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function CalendarDebugPage() {
  // Get current user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar Debug</h2>
          <p className="text-muted-foreground">Please log in to debug calendar data</p>
        </div>
      </div>
    );
  }

  // Get raw trades
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: true });

  // Get position tracker results
  const positionData = trades ? calculatePositions(trades) : null;

  // Get calendar data
  const calendarData = await getUserTradesGroupedByDay(user.id);

  // Get sample of daily data
  const dailyDataSample = Object.entries(calendarData.dailyData)
    .slice(0, 10)
    .map(([date, data]) => ({
      date,
      realizedPnL: data.realizedPnL,
      tradeCount: data.tradeCount,
      trades: data.trades.length,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar Debug</h2>
        <p className="text-muted-foreground">Debugging P&L calendar data processing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw Trade Data</CardTitle>
          <CardDescription>Direct from database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>Total Trades: {trades?.length || 0}</div>
            <div>Sample Trades:</div>
            {trades?.slice(0, 5).map((trade, i) => (
              <div key={i} className="pl-4 text-xs">
                {trade.symbol} - {trade.side} - {trade.quantity} @ ${trade.entry_price}
                {trade.exit_price && ` → $${trade.exit_price}`}
                {trade.status && ` (${trade.status})`}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Tracker Results</CardTitle>
          <CardDescription>Matched buy/sell orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>Closed Trades: {positionData?.closedTrades.length || 0}</div>
            <div>
              Open Positions:{' '}
              {positionData?.positions.filter((p) => p.openQuantity > 0).length || 0}
            </div>
            <div>Total P&L: ${positionData?.stats.totalPnL.toFixed(2) || '0.00'}</div>
            <div>Win Rate: {positionData?.stats.winRate.toFixed(1) || '0.0'}%</div>
            <div className="pt-2">Sample Closed Trades:</div>
            {positionData?.closedTrades.slice(0, 5).map((trade, i) => (
              <div key={i} className="pl-4 text-xs">
                {trade.symbol} - {trade.side} - P&L: ${trade.pnl.toFixed(2)}
                {trade.exit_date && ` on ${new Date(trade.exit_date).toLocaleDateString()}`}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Data Summary</CardTitle>
          <CardDescription>Processed for calendar display</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>Total Days with Data: {Object.keys(calendarData.dailyData).length}</div>
            <div>Trading Days (with P&L): {calendarData.tradingDays}</div>
            <div>Winning Days: {calendarData.winningDays}</div>
            <div>Losing Days: {calendarData.losingDays}</div>
            <div>Total Realized P&L: ${calendarData.totalRealizedPnL.toFixed(2)}</div>
            <div>
              Best Day: {calendarData.bestDay.date} (${calendarData.bestDay.pnl.toFixed(2)})
            </div>
            <div>
              Worst Day: {calendarData.worstDay.date} (${calendarData.worstDay.pnl.toFixed(2)})
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Data Sample</CardTitle>
          <CardDescription>First 10 days with trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyDataSample.length > 0 ? (
              dailyDataSample.map((day, i) => (
                <div key={i} className="flex justify-between font-mono text-sm">
                  <span>{day.date}</span>
                  <span className={day.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${day.realizedPnL.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">{day.tradeCount} trades</span>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No daily data found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debugging Information</CardTitle>
          <CardDescription>What might be wrong?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="font-semibold">Common Issues:</div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                Trades don't have matching buy/sell pairs →{' '}
                {positionData?.closedTrades.length === 0
                  ? '❌ No matched trades'
                  : '✅ Has matched trades'}
              </li>
              <li>
                All trades are still open →{' '}
                {positionData?.positions.filter((p) => p.openQuantity > 0).length === trades?.length
                  ? '❌ All open'
                  : '✅ Some closed'}
              </li>
              <li>No exit dates on trades → Check if sell orders are being matched</li>
              <li>Wrong date format → Dates should be YYYY-MM-DD</li>
            </ul>

            <div className="pt-4 font-semibold">Trade Structure:</div>
            <div className="text-xs text-muted-foreground">
              Your trades appear to be:{' '}
              {trades && trades.length > 0 && trades[0].exit_price
                ? 'Single trades with entry/exit'
                : 'Separate buy/sell orders'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
