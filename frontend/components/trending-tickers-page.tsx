"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useTrendingTickers } from "@/lib/useTrendingTickers";
import { useMemo } from "react";

export function TrendingTickersPage() {
  const { rows, error, isLoading, refresh } = useTrendingTickers();
  const tableRows = useMemo(() => {
    return (rows ?? []).map((r) => ({
      ...r,
      absChange: Number((r.price * r.changePct / 100).toFixed(2)),
    }));
  }, [rows]);

  if (process.env.NODE_ENV !== "production" && !Array.isArray(rows)) {
    // Dev warning
    console.warn("Trending rows is not array:", rows);
  }

  if (isLoading) return <div>Loading…</div>;
  if (error) {
    return (
      <div className="text-red-600 font-medium p-4">Error: Couldn’t load trending data.</div>
    );
  }
  if (!rows.length) {
    return (
      <div className="text-center text-muted-foreground py-8">No trending data right now.</div>
    );
  }
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trending Tickers</h2>
        <button onClick={() => refresh()} className="flex items-center border rounded px-2 py-1 text-xs">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Most Trending
          </CardTitle>
          <CardDescription>This list is generated from top gainers/losers and fallback tickers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Change %</TableHead>
                <TableHead className="text-right">Abs Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tableRows ?? []).map((row) => (
                <TableRow key={row.symbol}>
                  <TableCell className="font-medium">{row.symbol}</TableCell>
                  <TableCell>${row.price.toFixed(2)}</TableCell>
                  <TableCell className={row.changePct >= 0 ? "text-green-600 text-right" : "text-red-600 text-right"}>
                    {row.changePct >= 0 ? "+" : ""}{row.changePct.toFixed(2)}%
                  </TableCell>
                  <TableCell className={row.absChange >= 0 ? "text-green-600 text-right" : "text-red-600 text-right"}>
                    {row.absChange >= 0 ? "+" : ""}${row.absChange.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
