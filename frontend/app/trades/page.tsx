"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/components/auth-provider";

export default function TradesPage() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"raw" | "grouped">("raw");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (symbol) params.append("symbol", symbol);
    if (side && side !== "all") params.append("side", side);
    if (dateRange.from) params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange.to) params.append("dateTo", dateRange.to.toISOString());
    const endpoint = viewMode === "grouped" ? "/api/completed-trades" : "/api/trades";
    fetch(`${endpoint}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (viewMode === "grouped") {
          setGroupedTrades(data.completed_trades || []);
          setTotal(data.total || 0);
        } else {
          setTrades(data.trades || []);
          setTotal(data.total || 0);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch trades");
        setLoading(false);
      });
  }, [token, page, limit, symbol, side, dateRange, viewMode]);

  const totalPages = Math.ceil(total / limit);
  const tableData = viewMode === "grouped" ? groupedTrades : trades;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Trade Journal</h1>
        {/* View Mode Toggle */}
        <div className="flex gap-4 mb-4">
          <Button variant={viewMode === "raw" ? "default" : "outline"} onClick={() => setViewMode("raw")}>Raw Trades</Button>
          <Button variant={viewMode === "grouped" ? "default" : "outline"} onClick={() => setViewMode("grouped")}>Grouped Trades</Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <Input
            placeholder="Symbol"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="w-32"
          />
          <Select value={side} onValueChange={setSide}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            value={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : null}
            onChange={r => setDateRange(r || { from: null, to: null })}
          />
          <Button variant="outline" onClick={() => { setSymbol(""); setSide(""); setDateRange({ from: null, to: null }); }}>Clear Filters</Button>
        </div>
        {/* Table */}
        <Card className="mb-8">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Strike</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Option Type</TableHead>
                  <TableHead>Exit Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Net P&L</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-red-500 py-8">{error}</TableCell></TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8">No trades found.</TableCell></TableRow>
                ) : tableData.map(trade => {
                  const pnl = trade.realized_pnl ?? ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * (trade.quantity ?? 0);
                  const isOption = trade.type === "options" || trade.option_type;
                  // Option display: TSLA 07/03/2025 317.5c
                  const optionDisplay = isOption && trade.ticker && trade.expiration && trade.strike && trade.option_type
                    ? `${trade.ticker} ${trade.expiration.replace(/-/g, "/")} ${trade.strike}${trade.option_type[0].toLowerCase()}`
                    : "-";
                  return (
                    <TableRow key={trade.id || trade.trade_ids?.join("-") || Math.random()} onClick={() => setSelectedTrade(trade)} className={[
                      "cursor-pointer hover:bg-accent/40",
                      typeof pnl === "number" && pnl > 0 ? "text-green-600" : typeof pnl === "number" && pnl < 0 ? "text-red-600" : ""
                    ].join(" ")}
                    >
                      <TableCell>{trade.type ?? "-"}</TableCell>
                      <TableCell>{isOption ? optionDisplay : trade.symbol}</TableCell>
                      <TableCell>{trade.side}</TableCell>
                      <TableCell>{trade.quantity ?? trade.qty}</TableCell>
                      <TableCell>{trade.entry_price ?? trade.price}</TableCell>
                      <TableCell>{isOption ? trade.strike : "-"}</TableCell>
                      <TableCell>{isOption ? trade.expiration : "-"}</TableCell>
                      <TableCell>{isOption ? trade.option_type : "-"}</TableCell>
                      <TableCell>{trade.exit_price ?? "-"}</TableCell>
                      <TableCell>{trade.entry_time || trade.filled_time}</TableCell>
                      <TableCell>{trade.broker}</TableCell>
                      <TableCell>{trade.status}</TableCell>
                      <TableCell>{typeof pnl === "number" ? pnl.toFixed(2) : "--"}</TableCell>
                      <TableCell>{trade.duration || "-"}</TableCell>
                      <TableCell>
                        {viewMode === "grouped" && (
                          <a
                            href={`/chart-visualizer?tradeId=${trade.trade_ids?.[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-800"
                          >
                            View on Chart
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Pagination */}
        <div className="flex gap-2 items-center justify-center mb-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i+1} variant={page === i+1 ? "default" : "outline"} onClick={() => setPage(i+1)}>{i+1}</Button>
          ))}
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
        {/* Trade Detail Modal */}
        {selectedTrade && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedTrade(null)}>
            <div className="bg-card rounded-lg shadow-lg p-8 min-w-[320px] max-w-lg" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">Trade Details</h2>
              <div className="mb-2"><b>Type:</b> {selectedTrade.type ?? "-"}</div>
              <div className="mb-2"><b>Symbol:</b> {selectedTrade.symbol}</div>
              {selectedTrade.type === "options" || selectedTrade.option_type ? (
                <>
                  <div className="mb-2"><b>Ticker:</b> {selectedTrade.ticker}</div>
                  <div className="mb-2"><b>Expiration:</b> {selectedTrade.expiration}</div>
                  <div className="mb-2"><b>Strike:</b> {selectedTrade.strike}</div>
                  <div className="mb-2"><b>Option Type:</b> {selectedTrade.option_type}</div>
                </>
              ) : null}
              <div className="mb-2"><b>Side:</b> {selectedTrade.side}</div>
              <div className="mb-2"><b>Quantity:</b> {selectedTrade.quantity ?? selectedTrade.qty}</div>
              <div className="mb-2"><b>Entry Price:</b> {selectedTrade.entry_price ?? selectedTrade.price}</div>
              <div className="mb-2"><b>Exit Price:</b> {selectedTrade.exit_price ?? "-"}</div>
              <div className="mb-2"><b>Entry Time:</b> {selectedTrade.entry_time || selectedTrade.filled_time}</div>
              <div className="mb-2"><b>Exit Time:</b> {selectedTrade.exit_time || "-"}</div>
              <div className="mb-2"><b>Broker:</b> {selectedTrade.broker}</div>
              <div className="mb-2"><b>Status:</b> {selectedTrade.status}</div>
              <div className="mb-2"><b>Net P&L:</b> {typeof selectedTrade.realized_pnl === "number" ? selectedTrade.realized_pnl.toFixed(2) : "--"}</div>
              <div className="mb-2"><b>Duration:</b> {selectedTrade.duration || "-"}</div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setSelectedTrade(null)}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
