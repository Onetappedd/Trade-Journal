export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          default_broker: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          default_asset_type: "stock" | "option" | "futures" | "crypto"
          risk_tolerance: string
          email_notifications: boolean
          push_notifications: boolean
          trade_alerts: boolean
          weekly_reports: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          default_broker?: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          default_asset_type?: "stock" | "option" | "futures" | "crypto"
          risk_tolerance?: string
          email_notifications?: boolean
          push_notifications?: boolean
          trade_alerts?: boolean
          weekly_reports?: boolean
        }
        Update: {
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          default_broker?: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          default_asset_type?: "stock" | "option" | "futures" | "crypto"
          risk_tolerance?: string
          email_notifications?: boolean
          push_notifications?: boolean
          trade_alerts?: boolean
          weekly_reports?: boolean
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          asset_type: "stock" | "option" | "futures" | "crypto"
          broker: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          side: "buy" | "sell"
          quantity: number
          entry_price: number
          exit_price: number | null
          entry_date: string
          exit_date: string | null
          status: "open" | "closed"
          notes: string | null
          pnl: number | null
          fees: number
          strike_price: number | null
          expiration_date: string | null
          option_type: "call" | "put" | null
          hold_time_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          asset_type: "stock" | "option" | "futures" | "crypto"
          broker: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          side: "buy" | "sell"
          quantity: number
          entry_price: number
          exit_price?: number | null
          entry_date: string
          exit_date?: string | null
          status?: "open" | "closed"
          notes?: string | null
          fees?: number
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: "call" | "put" | null
        }
        Update: {
          symbol?: string
          asset_type?: "stock" | "option" | "futures" | "crypto"
          broker?: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
          side?: "buy" | "sell"
          quantity?: number
          entry_price?: number
          exit_price?: number | null
          entry_date?: string
          exit_date?: string | null
          status?: "open" | "closed"
          notes?: string | null
          fees?: number
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: "call" | "put" | null
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          color?: string
        }
        Update: {
          name?: string
          color?: string
        }
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string | null
          sector: string | null
          added_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          name?: string | null
          sector?: string | null
        }
        Update: {
          symbol?: string
          name?: string | null
          sector?: string | null
        }
      }
      trade_tags: {
        Row: {
          trade_id: string
          tag_id: string
        }
        Insert: {
          trade_id: string
          tag_id: string
        }
        Update: never
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          alert_type: "price_above" | "price_below" | "volume_spike" | "news"
          target_value: number | null
          is_active: boolean
          triggered_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          alert_type: "price_above" | "price_below" | "volume_spike" | "news"
          target_value?: number | null
          is_active?: boolean
        }
        Update: {
          symbol?: string
          alert_type?: "price_above" | "price_below" | "volume_spike" | "news"
          target_value?: number | null
          is_active?: boolean
          triggered_at?: string | null
        }
      }
      import_logs: {
        Row: {
          id: string
          user_id: string
          filename: string
          total_rows: number
          successful_imports: number
          failed_imports: number
          error_details: Json | null
          created_at: string
        }
        Insert: {
          user_id: string
          filename: string
          total_rows: number
          successful_imports: number
          failed_imports: number
          error_details?: Json | null
        }
        Update: never
      }
    }
    Views: {
      trade_summary: {
        Row: {
          user_id: string
          total_trades: number
          open_trades: number
          closed_trades: number
          winning_trades: number
          losing_trades: number
          total_pnl: number
          avg_pnl: number
          best_trade: number
          worst_trade: number
          win_rate: number
        }
      }
    }
  }
}
