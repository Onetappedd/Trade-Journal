import { CurrentPriceResponse, HistoricalDataPoint, CompanyInfo } from "@/types/financial-data";
import { Trade, TradeFormInput } from "@/types/trade";

export async function addTrade(trade: TradeFormInput): Promise<{ success: boolean; tradeId: string }> {
  const res = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error("Failed to add trade");
  return await res.json();
}

export async function updateTrade(tradeId: string, trade: TradeFormInput): Promise<{ success: boolean; tradeId: string }> {
  const res = await fetch(`/api/trades/${tradeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error("Failed to update trade");
  return await res.json();
}

export async function fetchTradeTags(): Promise<string[]> {
  const res = await fetch("/api/trade-tags");
  if (!res.ok) throw new Error("Failed to fetch trade tags");
  return await res.json();
}

export async function fetchCurrentPrice(symbol: string): Promise<CurrentPriceResponse> {
  try {
    const res = await fetch(`/api/data/stock/current-price?symbol=${symbol}`);
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to fetch current price:", errorData.error);
      return { price: null };
    }
    const data = await res.json();
    return { price: data.price };
  } catch (error) {
    console.error("Error fetching current price:", error);
    return { price: null };
  }
}

export async function fetchHistoricalPrices(symbol: string, period: string): Promise<HistoricalDataPoint[] | null> {
  try {
    const res = await fetch(`/api/data/stock/historical-prices?symbol=${symbol}&period=${period}`);
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to fetch historical prices:", errorData.error);
      return null;
    }
    const data = await res.json();
    return data.history || data; // Accepts either {history: [...]} or [...] for flexibility
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    return null;
  }
}

export async function fetchCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
  try {
    const res = await fetch(`/api/data/stock/info?symbol=${symbol}`);
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to fetch company info:", errorData.error);
      return null;
    }
    const data = await res.json();
    return data as CompanyInfo;
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}
