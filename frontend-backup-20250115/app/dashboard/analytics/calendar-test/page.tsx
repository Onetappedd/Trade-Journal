import { getSimplifiedCalendarData } from '@/lib/calendar-metrics-simple';
import { getUserTradesGroupedByDay } from '@/lib/calendar-metrics';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function CalendarTestPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Calendar Test</h2>
          <p className="text-muted-foreground">Please log in to test calendar data</p>
        </div>
      </div>
    );
  }

  // Get simplified data for debugging
  const simpleData = await getSimplifiedCalendarData(user.id);

  // Get full calendar data
  const calendarData = await getUserTradesGroupedByDay(user.id);

  // Get raw trades for inspection
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar Data Test</h2>
        <p className="text-muted-foreground">
          Debugging P&L calendar data processing for options trades
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Overview of processed data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>Total Trades Found: {trades?.length || 0}</div>
            <div>Closed Trades Processed: {simpleData?.closedTradesCount || 0}</div>
            <div>Total P&L Calculated: ${simpleData?.totalPnL?.toFixed(2) || '0.00'}</div>
            <div>Trading Days: {simpleData?.tradingDays || 0}</div>
            <div>Calendar Data Days: {Object.keys(calendarData.dailyData).length}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily P&L Breakdown</CardTitle>
          <CardDescription>P&L grouped by exit date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {simpleData &&
              Object.entries(simpleData.dailyPnL)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 10)
                .map(([date, pnl]) => (
                  <div key={date} className="flex justify-between font-mono text-sm">
                    <span>{date}</span>
                    <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
            {(!simpleData || Object.keys(simpleData.dailyPnL).length === 0) && (
              <div className="text-muted-foreground">No P&L data found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Trades (Last 10)</CardTitle>
          <CardDescription>Raw trade data from database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Side</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Entry</th>
                  <th className="text-left p-2">Exit</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Exit Date</th>
                </tr>
              </thead>
              <tbody>
                {trades?.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="p-2 font-mono">{trade.symbol}</td>
                    <td className="p-2">{trade.asset_type}</td>
                    <td className="p-2">{trade.side}</td>
                    <td className="p-2">{trade.quantity}</td>
                    <td className="p-2">${trade.entry_price}</td>
                    <td className="p-2">{trade.exit_price ? `$${trade.exit_price}` : '-'}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          trade.status === 'closed' ? 'bg-gray-100' : 'bg-blue-100'
                        }`}
                      >
                        {trade.status || 'open'}
                      </span>
                    </td>
                    <td className="p-2">
                      {trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Check console for detailed logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Open browser console (F12) to see:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>[Calendar] Processing logs for each trade</li>
              <li>P&L calculations with multipliers</li>
              <li>Reasons for skipped trades</li>
              <li>Daily aggregation results</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
