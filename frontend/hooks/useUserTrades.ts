import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useTradeData } from "./TradeDataProvider";

export function useUserTrades() {
  const { token } = useAuth();
  const { refreshTrades } = useTradeData();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setTrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/trades", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch trades");
        return res.json();
      })
      .then(data => {
        // Support both {trades: [...]} and [...] response shapes
        setTrades(Array.isArray(data) ? data : (data.trades || []));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch trades");
        setLoading(false);
      });
  }, [token, refreshKey]);

  // Expose a function to trigger refresh
  return { trades, loading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
