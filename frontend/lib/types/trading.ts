// Database types for the trading system
// These match the Supabase schema exactly

export type BrokerType = 'td_ameritrade' | 'etrade' | 'fidelity' | 'robinhood' | 'ibkr' | 'tastyworks'
export type BrokerStatus = 'disabled' | 'connected' | 'error' | 'expired'
export type ImportSource = 'csv' | 'email' | 'manual' | 'api'
export type ImportStatus = 'pending' | 'processing' | 'partial' | 'success' | 'failed'
export type RawItemStatus = 'parsed' | 'error' | 'duplicate'
export type InstrumentType = 'equity' | 'option' | 'futures'
export type TradeSide = 'buy' | 'sell' | 'short' | 'cover'
export type OptionType = 'C' | 'P'
export type TradeStatus = 'open' | 'closed'
export type CorporateActionType = 'split' | 'dividend' | 'occ_adjustment'

export interface BrokerAccount {
  id: string
  user_id: string
  broker: BrokerType
  label: string
  status: BrokerStatus
  connected_at: string | null
  access_token_enc: string | null
  refresh_token_enc: string | null
  expires_at: string | null
  account_ids: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface ImportRun {
  id: string
  user_id: string
  broker_account_id: string | null
  source: ImportSource
  status: ImportStatus
  started_at: string
  finished_at: string | null
  summary: Record<string, any> | null
  error: string | null
  created_at: string
}

export interface RawImportItem {
  id: string
  import_run_id: string
  user_id: string
  source_line: number
  raw_payload: Record<string, any>
  status: RawItemStatus
  error: string | null
  created_at: string
}

export interface ExecutionNormalized {
  id: string
  user_id: string
  broker_account_id: string | null
  source_import_run_id: string | null
  instrument_type: InstrumentType
  symbol: string
  occ_symbol: string | null
  futures_symbol: string | null
  side: TradeSide
  quantity: number
  price: number
  fees: number
  currency: string
  timestamp: string
  venue: string | null
  order_id: string | null
  exec_id: string | null
  multiplier: number
  expiry: string | null
  strike: number | null
  option_type: OptionType | null
  underlying: string | null
  notes: string | null
  unique_hash: string
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  group_key: string
  instrument_type: InstrumentType
  symbol: string
  opened_at: string
  closed_at: string | null
  qty_opened: number
  qty_closed: number
  avg_open_price: number
  avg_close_price: number | null
  realized_pnl: number | null
  fees: number
  legs: Record<string, any> | null
  status: TradeStatus
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Instrument {
  id: string
  instrument_type: InstrumentType
  unique_symbol: string
  multiplier: number
  exchange: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface InstrumentAlias {
  id: string
  instrument_id: string
  alias_symbol: string
  source: string
  created_at: string
}

export interface CorporateAction {
  id: string
  symbol: string
  type: CorporateActionType
  effective_date: string
  factor: number | null
  memo_url: string | null
  payload: Record<string, any> | null
  created_at: string
}

// Insert types (for creating new records)
export type BrokerAccountInsert = Omit<BrokerAccount, 'id' | 'created_at' | 'updated_at'>
export type ImportRunInsert = Omit<ImportRun, 'id' | 'created_at'>
export type RawImportItemInsert = Omit<RawImportItem, 'id' | 'created_at'>
export type ExecutionNormalizedInsert = Omit<ExecutionNormalized, 'id' | 'unique_hash' | 'created_at'>
export type TradeInsert = Omit<Trade, 'id' | 'created_at' | 'updated_at'>
export type InstrumentInsert = Omit<Instrument, 'id' | 'created_at' | 'updated_at'>
export type InstrumentAliasInsert = Omit<InstrumentAlias, 'id' | 'created_at'>
export type CorporateActionInsert = Omit<CorporateAction, 'id' | 'created_at'>

// Update types (for updating existing records)
export type BrokerAccountUpdate = Partial<Omit<BrokerAccount, 'id' | 'user_id' | 'created_at'>>
export type ImportRunUpdate = Partial<Omit<ImportRun, 'id' | 'user_id' | 'created_at'>>
export type RawImportItemUpdate = Partial<Omit<RawImportItem, 'id' | 'import_run_id' | 'user_id' | 'created_at'>>
export type ExecutionNormalizedUpdate = Partial<Omit<ExecutionNormalized, 'id' | 'user_id' | 'unique_hash' | 'created_at'>>
export type TradeUpdate = Partial<Omit<Trade, 'id' | 'user_id' | 'created_at'>>
export type InstrumentUpdate = Partial<Omit<Instrument, 'id' | 'created_at'>>
export type InstrumentAliasUpdate = Partial<Omit<InstrumentAlias, 'id' | 'instrument_id' | 'created_at'>>
export type CorporateActionUpdate = Partial<Omit<CorporateAction, 'id' | 'created_at'>>

// Database table names
export const TABLES = {
  BROKER_ACCOUNTS: 'broker_accounts',
  IMPORT_RUNS: 'import_runs',
  RAW_IMPORT_ITEMS: 'raw_import_items',
  EXECUTIONS_NORMALIZED: 'executions_normalized',
  TRADES: 'trades',
  INSTRUMENTS: 'instruments',
  INSTRUMENT_ALIASES: 'instrument_aliases',
  CORPORATE_ACTIONS: 'corporate_actions'
} as const

// Helper types for common queries
export interface ExecutionWithBroker extends ExecutionNormalized {
  broker_account: BrokerAccount | null
}

export interface TradeWithExecutions extends Trade {
  executions: ExecutionNormalized[]
}

export interface ImportRunWithItems extends ImportRun {
  raw_items: RawImportItem[]
  broker_account: BrokerAccount | null
}

// Filter types for queries
export interface ExecutionFilters {
  user_id?: string
  symbol?: string
  instrument_type?: InstrumentType
  side?: TradeSide
  date_from?: string
  date_to?: string
  broker_account_id?: string
}

export interface TradeFilters {
  user_id?: string
  symbol?: string
  instrument_type?: InstrumentType
  status?: TradeStatus
  date_from?: string
  date_to?: string
}

export interface ImportRunFilters {
  user_id?: string
  source?: ImportSource
  status?: ImportStatus
  date_from?: string
  date_to?: string
}
