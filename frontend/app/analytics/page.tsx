"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/components/auth-provider";

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [symbol, setSymbol] = useState("");
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (symbol) params.append("symbol", symbol);
    if (dateRange.from) params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange.to) params.append("dateTo", dateRange.to.toISOString());
    fetch(`/api/analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch analytics");
        setLoading(false);
      });
  }, [token, dateRange, symbol]);

  useEffect(() => {
    setTrendingLoading(true);
    setTrendingError("");
    fetch("/api/trending-tickers")
      .then(res => res.json())
      .then(data => {
        setTrending(data.trending || []);
        setTrendingLoading(false);
      })
      .catch(() => {
        setTrendingError("Failed to fetch trending tickers");
        setTrendingLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <Input
            placeholder="Symbol"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="w-32"
          />
          <DateRangePicker
            value={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : null}
            onChange={r => setDateRange(r || { from: null, to: null })}
          />
          <Button variant="outline" onClick={() => { setSymbol(""); setDateRange({ from: null, to: null }); }}>Clear Filters</Button>
        </div>
        {/* Overview KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {loading || !analytics ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded" />)
          ) : error ? (
            <div className="col-span-3 text-red-500 text-center">{error}</div>
          ) : (
            <>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Total Trades</div><div className="text-2xl font-bold">{analytics?.overall?.total_trades ?? 0}</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Win Rate</div><div className="text-2xl font-bold">{analytics?.overall?.win_rate !== undefined ? (analytics.overall.win_rate * 100).toFixed(1) : "--"}%</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Avg Win</div><div className="text-2xl font-bold">{analytics?.overall?.avg_win !== undefined ? analytics.overall.avg_win.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Avg Loss</div><div className="text-2xl font-bold">{analytics?.overall?.avg_loss !== undefined ? analytics.overall.avg_loss.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Best Trade</div><div className="text-2xl font-bold">{analytics?.overall?.best_trade ? analytics.overall.best_trade.realized_pnl.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Worst Trade</div><div className="text-2xl font-bold">{analytics?.overall?.worst_trade ? analytics.overall.worst_trade.realized_pnl.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-6 text-center"><div className="text-lg font-semibold">Avg Holding Time</div><div className="text-2xl font-bold">{analytics?.overall?.avg_holding_time ?? "--"}</div></CardContent></Card>
            </>
          )}
        </div>
        {/* Risk Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {loading || !analytics ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded" />)
          ) : error ? null : (
            <>
              <Card><CardContent className="py-4 text-center"><div className="text-lg font-semibold">Max Drawdown</div><div className="text-xl font-bold">{analytics?.risk?.max_drawdown !== undefined ? analytics.risk.max_drawdown.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-4 text-center"><div className="text-lg font-semibold">Sharpe Ratio</div><div className="text-xl font-bold">{analytics?.risk?.sharpe_ratio !== undefined && analytics.risk.sharpe_ratio !== null ? analytics.risk.sharpe_ratio.toFixed(2) : "--"}</div></CardContent></Card>
              <Card><CardContent className="py-4 text-center"><div className="text-lg font-semibold">Profit Factor</div><div className="text-xl font-bold">{analytics?.risk?.profit_factor !== undefined && analytics.risk.profit_factor !== null ? analytics.risk.profit_factor.toFixed(2) : "--"}</div></CardContent></Card>
            </>
          )}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Benchmark Comparison */}
          <Card className="col-span-1 md:col-span-2">
            <CardContent className="py-6">
              <h2 className="text-xl font-bold mb-2">Equity Curve vs. SPY & QQQ</h2>
              {loading || !analytics ? <Skeleton className="w-full h-64 rounded-lg" /> : (
                <div className="w-full h-64 flex items-center justify-center overflow-x-auto">
                  {/* Simple SVG line chart for demo; replace with recharts/chart.js for production */}
                  {analytics?.benchmark_comparison?.dates?.length > 0 ? (
                    <svg width={600} height={240}>
                      {/* Axes and labels omitted for brevity */}
                      {["user_equity", "SPY", "QQQ"].map((key, idx) => {
                        const color = ["#22c55e", "#2563eb", "#f59e42"][idx];
                        const data = analytics?.benchmark_comparison?.[key];
                        if (!data || data.length === 0) return null;
                        const max = Math.max(...data);
                        const min = Math.min(...data);
                        const scaleX = 580 / (data.length - 1 || 1);
                        const scaleY = 200 / (max - min || 1);
                        const points = data.map((v: number, i: number) => `${20 + i * scaleX},${220 - (v - min) * scaleY}`).join(" ");
                        return <polyline key={key} fill="none" stroke={color} strokeWidth={2} points={points} />;
                      })}
                      {/* Legend */}
                      <rect x={20} y={10} width={12} height={12} fill="#22c55e" /><text x={36} y={20} fontSize={12}>User</text>
                      <rect x={100} y={10} width={12} height={12} fill="#2563eb" /><text x={116} y={20} fontSize={12}>SPY</text>
                      <rect x={180} y={10} width={12} height={12} fill="#f59e42" /><text x={196} y={20} fontSize={12}>QQQ</text>
                    </svg>
                  ) : <div className="text-muted-foreground">No benchmark data.</div>}
                </div>
              )}
            </CardContent>
          </Card>
          {/* PnL Over Time */}
          {/* PnL Over Time */}
          <Card><CardContent className="py-6">
            <h2 className="text-xl font-bold mb-2">PnL Over Time</h2>
            {loading || !analytics ? <Skeleton className="w-full h-64 rounded-lg" /> : (
              <div className="w-full h-64 flex items-center justify-center overflow-x-auto">
                {analytics?.time && analytics.time.length > 0 ? (
                  <svg width={600} height={240}>
                    {(() => {
                      const data = analytics.time;
                      const max = Math.max(...data.map((d: any) => d.pnl));
                      const min = Math.min(...data.map((d: any) => d.pnl));
                      const scaleX = 580 / (data.length - 1 || 1);
                      const scaleY = 200 / (max - min || 1);
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2}
                            points={data.map((d: any, i: number) => `${20 + i * scaleX},${220 - (d.pnl - min) * scaleY}`).join(" ")}
                          />
                        </>
                      );
                    })()}
                  </svg>
                ) : <div className="text-muted-foreground">No PnL data.</div>}
              </div>
            )}
          </CardContent></Card>
          {/* Top Symbols */}
          <Card><CardContent className="py-6">
          <h2 className="text-xl font-bold mb-2">Top Symbols</h2>
          {loading || !analytics ? <Skeleton className="w-full h-64 rounded-lg" /> : (
          <div className="w-full h-64 flex items-center justify-center overflow-x-auto">
          {analytics?.top_gainers && analytics.top_gainers.length > 0 ? (
          <svg width={400} height={240}>
          {analytics.top_gainers.map((s: any, i: number) => {
          const isOption = s.type === "options" || s.option_type;
          const optionDisplay = isOption && s.ticker && s.expiration && s.strike && s.option_type
          ? `${s.ticker} ${s.expiration.replace(/-/g, "/")} ${s.strike}${s.option_type[0].toLowerCase()}`
          : s.symbol;
          return (
          <g key={s.symbol + i}>
          <rect x={120} y={30 + i * 40} width={Math.max(1, Math.abs(s.net_pnl) / 2)} height={24} fill={s.net_pnl >= 0 ? "#22c55e" : "#ef4444"} />
          <text x={10} y={46 + i * 40} fontSize={14}>{optionDisplay}</text>
          <text x={130 + Math.max(1, Math.abs(s.net_pnl) / 2)} y={46 + i * 40} fontSize={14}>{s.net_pnl.toFixed(2)}</text>
          </g>
          );
          })}
          </svg>
          ) : <div className="text-muted-foreground">No symbol data.</div>}
          </div>
          )}
          </CardContent></Card>
          {/* Win Rate by Day */}
          <Card className="col-span-1 md:col-span-2"><CardContent className="py-6">
            <h2 className="text-xl font-bold mb-2">Win Rate by Day</h2>
            {loading || !analytics ? <Skeleton className="w-full h-64 rounded-lg" /> : (
              <div className="w-full h-64 flex items-center justify-center overflow-x-auto">
                {analytics?.time && analytics.time.length > 0 ? (
                  <svg width={600} height={240}>
                    {(() => {
                      const data = analytics.time;
                      const max = 1;
                      const scaleX = 580 / (data.length - 1 || 1);
                      return (
                        <>
                          {data.map((d: any, i: number) => (
                            <rect
                              key={d.date}
                              x={20 + i * scaleX}
                              y={220 - d.win_rate * 200}
                              width={scaleX - 2}
                              height={d.win_rate * 200}
                              fill="#f59e42"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                ) : <div className="text-muted-foreground">No win rate data.</div>}
              </div>
            )}
          </CardContent></Card>
        </div>
        {/* Trending Tickers Table */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Trending Tickers (Twitter/X Sentiment)</h2>
          {trendingLoading ? (
            <Skeleton className="w-full h-32 rounded" />
          ) : trendingError ? (
            <div className="text-red-500 text-center">{trendingError}</div>
          ) : trending.length === 0 ? (
            <div className="text-muted-foreground text-center">No trending tickers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2">Symbol</th>
                    <th className="px-4 py-2">Mentions</th>
                    <th className="px-4 py-2">Sentiment</th>
                    <th className="px-4 py-2">Avg Score</th>
                    <th className="px-4 py-2">Top Tweets</th>
                  </tr>
                </thead>
                <tbody>
                  {trending.slice(0, 10).map((t: any) => (
                    <tr key={t.symbol}>
                      <td className="font-bold text-lg text-primary px-4 py-2">{t.symbol}</td>
                      <td className="px-4 py-2">{t.total_mentions}</td>
                      <td className="px-4 py-2">
                        <span className="text-green-600">{t.positive_pct.toFixed(1)}%+</span> /
                        <span className="text-yellow-600"> {t.neutral_pct.toFixed(1)}% </span>/
                        <span className="text-red-600">{t.negative_pct.toFixed(1)}%-</span>
                      </td>
                      <td className="px-4 py-2">{t.avg_sentiment_score.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {t.top_tweets && t.top_tweets.length > 0 ? (
                          <ul className="list-disc ml-4">
                            {t.top_tweets.slice(0, 2).map((tw: any, i: number) => (
                              <li key={i} className={tw.sentiment === "Positive" ? "text-green-600" : tw.sentiment === "Negative" ? "text-red-600" : "text-yellow-600"}>
                                <span className="font-semibold">[{tw.sentiment}]</span> {tw.text.slice(0, 80)}
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-muted-foreground">No tweets</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Error/Empty State */}
        {error && <div className="text-red-500 text-center text-lg">{error}</div>}
        {!loading && analytics && analytics.overall.total_trades === 0 && (
          <div className="text-center text-lg text-muted-foreground">No trades found for the selected filters.</div>
        )}
      </div>
    </div>
  );
}
