// Shared type for rows read from CSV/XLSX
export type Row = Record<string, any>
export interface NormalizedTrade {
  symbol: string
  underlying?: string
  side: string // 'buy' | 'sell'
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number
  exit_date?: string
  asset_type?: string
  broker?: string
  account_external?: string
  account_id?: string // will be mapped
  source_broker?: string
  fees?: number
  note?: string
  raw?: Row
}
