export type AssetType = 'equity' | 'option' | 'futures' | 'crypto';

export type OptionType = 'CALL' | 'PUT';

export interface CanonicalTrade {
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  underlying?: string;
  expiry?: string;
  strike?: number;
  option_type?: OptionType;
  side: 'BUY' | 'SELL';
  open_close?: 'OPEN' | 'CLOSE';
  quantity: number;
  price: number;
  fees?: number;
  trade_time_utc: string;
  venue?: string;
  source?: string;
  import_run_id: string;
  row_hash: string;
  raw_json?: unknown;
  [key: string]: unknown;
}
