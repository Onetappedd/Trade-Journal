"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabaseClient";

export default function AnalyticsPage() {
  const { user } = useAuth();
  if (!user) return <p>Please log in to view your analytics.</p>;

  // FIXED: use object, not array!
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [symbol, setSymbol] = useState<string>("");

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_analytics", {
          uid: user.id,
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
          symbol: symbol || null,
        });
        if (!isMounted) return;
        if (error) {
          console.error(error);
          setError("Failed to fetch analytics");
          setAnalytics(null);
        } else {
          setAnalytics(data);
        }
      } catch (e) {
        if (!isMounted) return;
        setError("Failed to fetch analytics");
        setAnalytics(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, dateRange, symbol]);

  // Trending tickers still public, so keep fetch
  const [trending, setTrending] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setTrendingLoading(true);
    setTrendingError("");
    (async () => {
      try {
        const res = await fetch("/api/trending-tickers");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!isMounted) return;
        setTrending(data.trending || []);
      } catch {
        if (isMounted) setTrendingError("Failed to fetch trending tickers");
      } finally {
        if (isMounted) setTrendingLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="p-4 space-y-6 flex-1">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Input
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <Button onClick={() => {/* optional manual refresh */}}>Refresh</Button>
        </div>

        {/* Analytics Cards */}
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : analytics ? (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <h3 className="text-lg font-medium">Total P&L</h3>
                <p className="mt-2">${analytics.overall?.total_pnl ?? "--"}</p>
              </CardContent>
            </Card>
            {/* ...other cards... */}
          </div>
        ) : null}

        {/* Error / Empty */}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && analytics?.overall?.total_trades === 0 && (
          <div className="text-gray-500">No trades found for the filters.</div>
        )}

        {/* Trending */}
        <div>
          <h3 className="text-lg font-medium">Trending Tickers</h3>
          {trendingLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : trendingError ? (
            <div className="text-red-500">{trendingError}</div>
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {trending.map((t) => (
                <Button key={t} variant="outline">
                  {t}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
