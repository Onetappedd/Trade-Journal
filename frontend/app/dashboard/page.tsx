"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import ProtectedPage from "@/components/ProtectedPage";
// Import your chart components (use recharts, chart.js, or similar)
// import EquityCurveChart from "@/components/charts/EquityCurveChart";
// import WinLossPieChart from "@/components/charts/WinLossPieChart";
// import PnLByDayChart from "@/components/charts/PnLByDayChart";
// import RRHistogram from "@/components/charts/RRHistogram";
// import SymbolStrategyBreakdown from "@/components/charts/SymbolStrategyBreakdown";
// import ProfitCalendar from "@/components/charts/ProfitCalendar";

import { useUserTrades } from "@/hooks/useUserTrades";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { trades, loading, error } = useUserTrades();
  const { user } = useAuth();

  // Example KPIs from real data
  const totalPL = trades.reduce((sum, t) => sum + ((t.exit ?? 0) - (t.price ?? 0)) * (t.qty ?? 0), 0);
  const winCount = trades.filter(t => ((t.exit ?? 0) - (t.price ?? 0)) > 0).length;
  const lossCount = trades.filter(t => ((t.exit ?? 0) - (t.price ?? 0)) < 0).length;
  const winRate = trades.length ? Math.round((winCount / trades.length) * 100) : 0;
  const bestTrade = trades.reduce((best, t) => {
    const pnl = ((t.exit ?? 0) - (t.price ?? 0)) * (t.qty ?? 0);
    return pnl > (best.pnl ?? -Infinity) ? { ...t, pnl } : best;
  }, {} as any);
  const worstTrade = trades.reduce((worst, t) => {
    const pnl = ((t.exit ?? 0) - (t.price ?? 0)) * (t.qty ?? 0);
    return pnl < (worst.pnl ?? Infinity) ? { ...t, pnl } : worst;
  }, {} as any);
  const avgRR = trades.length ? (trades.reduce((sum, t) => sum + ((t.exit ?? 0) - (t.price ?? 0)) / Math.abs(t.price ?? 1), 0) / trades.length).toFixed(2) : "-";

  const kpis = [
    { label: "Total P&L", value: `${totalPL.toFixed(2)}` },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Best Trade", value: bestTrade.pnl !== undefined ? `${bestTrade.pnl.toFixed(2)}` : "--" },
    { label: "Worst Trade", value: worstTrade.pnl !== undefined ? `${worstTrade.pnl.toFixed(2)}` : "--" },
    { label: "Avg R:R", value: avgRR },
  ];

  // Placeholder filter controls
  // Replace with real filter state and handlers
  return (
    <ProtectedPage>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 w-full max-w-7xl mx-auto px-2 md:px-8 py-8 flex flex-col gap-8">
        {/* Header with username */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-lg font-bold">Welcome, {user?.username || user?.email || "Trader"}!</span>
          </div>
          <Button variant="default">Reset Filters</Button>
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="flex flex-col items-center justify-center py-6">
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-base font-medium text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl md:text-3xl font-bold text-center">{kpi.value}</CardContent>
            </Card>
          ))}
        </div>
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <EquityCurveChart ... /> */}
              <div className="text-muted-foreground">[Equity Curve Chart]</div>
            </CardContent>
          </Card>
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>Win/Loss Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <WinLossPieChart ... /> */}
              <div className="text-muted-foreground">[Win/Loss Pie Chart]</div>
            </CardContent>
          </Card>
        </div>
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>P&L by Day</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <PnLByDayChart ... /> */}
              <div className="text-muted-foreground">[P&L by Day Chart]</div>
            </CardContent>
          </Card>
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>R:R Histogram</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <RRHistogram ... /> */}
              <div className="text-muted-foreground">[R:R Histogram]</div>
            </CardContent>
          </Card>
        </div>
        {/* Symbol/Strategy Breakdown and Profit Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>Symbol/Strategy Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <SymbolStrategyBreakdown ... /> */}
              <div className="text-muted-foreground">[Symbol/Strategy Breakdown]</div>
            </CardContent>
          </Card>
          <Card className="h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>Profit Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {/* <ProfitCalendar ... /> */}
              <div className="text-muted-foreground">[Profit Calendar Widget]</div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </ProtectedPage>
  );
}
