import { ASSET_TYPES, BROKER_ENUM, SIDE_ENUM, STATUS_ENUM } from '@/lib/enums';
export type AssetType = typeof ASSET_TYPES[number];
export type Broker = typeof BROKER_ENUM[number];
export type Side = typeof SIDE_ENUM[number];
export type Status = typeof STATUS_ENUM[number];
export type TradeRow = {
  id: string; user_id: string; symbol: string; asset_type: AssetType; broker: Broker; side: Side; status: Status;
  quantity: number; entry_price: number | null; exit_price: number | null;
  entry_date: string; exit_date: string | null;
  pnl: number | null; fees: number | null; strike_price: number | null;
  expiration_date: string | null; option_type: string | null; underlying: string | null;
  multiplier: number | null; currency: string | null; fees_currency: string | null; notes: string | null;
};
export type TradesResponse = { items: TradeRow[]; total: number };