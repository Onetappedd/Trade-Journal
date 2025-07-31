import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function useUserTrades() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setTrades(Array.isArray(data) ? data : (data.trades || []));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch trades");
        setLoading(false);
      });
  }, [token]);

  return { trades, loading, error };
}
