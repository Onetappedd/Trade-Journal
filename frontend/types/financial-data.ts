export interface CurrentPriceResponse {
  symbol?: string;
  price: number | null;
}

export interface HistoricalDataPoint {
  date: string; // YYYY-MM-DD or ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyInfo {
  name: string;
  sector: string;
  industry: string;
  marketCap: number | string;
  description: string;
  currency?: string;
  // Add other relevant fields if your backend returns them
  // exchange?: string;
  // regularMarketPrice?: number;
  // regularMarketChangePercent?: number;
}
