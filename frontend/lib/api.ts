import { CurrentPriceResponse, HistoricalDataPoint, CompanyInfo } from "@/types/financial-data";

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
