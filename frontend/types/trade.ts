export type AssetType = "Stock" | "Option" | "Futures" | "Crypto";
export type Side = "Long" | "Short" | "Buy" | "Sell";
export interface Trade {
  id: string;
  symbol: string;
  assetType: AssetType;
  side: Side;
  quantity: number;
  avgEntry?: number;
  avgExit?: number;
  fees?: number;
  pnl?: number;           // net
  grossPnl?: number;
  date: string;           // ISO
  closeDate?: string;     // ISO
  durationMin?: number;
  strategy?: string;
  tags?: string[];
  notes?: string;
  fills?: Array<{ time: string; price: number; qty: number; side: "B"|"S" }>;
  attachments?: Array<{ id: string; name: string; url: string }>;
  rMultiple?: number;
}
