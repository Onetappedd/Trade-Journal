// frontend/app/trades/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-provider";

export default function TradesPage() {
  const { user } = useAuth();
  if (!user) return <p>Please log in to view your trades.</p>;

  const [trades, setTrades] = useState<any[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"raw" | "grouped">("raw");

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (symbol) params.append("symbol", symbol);
    if (side && side !== "all") params.append("side", side);
    if (dateRange.from)
      params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange.to) params.append("dateTo", dateRange.to.toISOString());

    const endpoint =
      viewMode === "grouped" ? "/api/completed-trades" : "/api/trades";

    // No auth header needed; these API routes enforce RLS on server
    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (viewMode === "grouped") {
          setGroupedTrades(data.completed_trades || []);
          setTotal(data.total || 0);
        } else {
          setTrades(data.trades || []);
          setTotal(data.total || 0);
        }
      })
      .catch(() => setError("Failed to fetch trades"))
      .finally(() => setLoading(false));
  }, [page, limit, symbol, side, dateRange, viewMode]);

  const totalPages = Math.ceil(total / limit);
  const tableData = viewMode === "grouped" ? groupedTrades : trades;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trade Journal</h1>

        {/* View Mode */}
        <div className="flex gap-4 mb-4">
          <Button
            variant={viewMode === "raw" ? "default" : "outline"}
            onClick={() => setViewMode("raw")}
          >
            Raw Trades
          </Button>
          <Button
            variant={viewMode === "grouped" ? "default" : "outline"}
            onClick={() => setViewMode("grouped")}
          >
            Grouped Trades
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-32"
          />
          <Select
            value={side}
            onValueChange={(v) => setSide(v === "all" ? "" : v)}
          >
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
            value={
              dateRange.from && dateRange.to
                ? { from: dateRange.from, to: dateRange.to }
                : null
            }
            onChange={(r) =>
              setDateRange(r || { from: null, to: null })
            }
          />
          <Button
            variant="outline"
            onClick={() => {
              setSymbol("");
              setSide("");
              setDateRange({ from: null, to: null });
            }}
          >
            Clear
          </Button>
        </div>

        {/* Table */}
        <Card className="mb-8">
          <CardContent className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Date</th>
                  <th>Broker</th>
                  <th>Status</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="text-center text-red-500 py-8">
                      {error}
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      No trades found.
                    </td>
                  </tr>
                ) : (
                  tableData.map((trade: any) => {
                    const pnl =
                      trade.realized_pnl ??
                      (trade.exit_price - trade.entry_price) * trade.qty;
                    return (
                      <tr
                        key={trade.id}
                        className={
                          pnl > 0
                            ? "text-green-600"
                            : pnl < 0
                            ? "text-red-600"
                            : ""
                        }
                      >
                        <td>{trade.type}</td>
                        <td>{trade.symbol}</td>
                        <td>{trade.side}</td>
                        <td>{trade.qty}</td>
                        <td>{trade.entry_price}</td>
                        <td>{trade.exit_price || "-"}</td>
                        <td>{trade.entry_time}</td>
                        <td>{trade.broker}</td>
                        <td>{trade.status}</td>
                        <td>
                          {typeof pnl === "number" ? pnl.toFixed(2) : "--"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex gap-2 justify-center mb-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
