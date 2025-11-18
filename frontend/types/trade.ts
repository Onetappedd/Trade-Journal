import { ASSET_TYPES, BROKER_ENUM, SIDE_ENUM, STATUS_ENUM } from '@/lib/enums';
export type AssetType = typeof ASSET_TYPES[number];
export type Broker = typeof BROKER_ENUM[number];
export type Side = typeof SIDE_ENUM[number];
export type Status = typeof STATUS_ENUM[number];
export type TradeRow = {
  id: string; user_id: string; symbol: string; instrument_type: string; status: string;
  qty_opened: number; qty_closed: number | null; avg_open_price: number; avg_close_price: number | null;
  opened_at: string; closed_at: string | null;
  realized_pnl: number | null; fees: number | null; created_at: string | null; updated_at: string | null;
  group_key: string; ingestion_run_id: string | null; row_hash: string | null; legs: any | null;
  notes: string | null; tags: string[];
};
export type TradesResponse = { items: TradeRow[]; total: number };