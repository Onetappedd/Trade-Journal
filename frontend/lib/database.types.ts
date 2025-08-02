export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          condition: Database["public"]["Enums"]["alert_condition"]
          created_at: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["alert_status"]
          symbol: string
          target_value: number
          triggered_at: string | null
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Insert: {
          condition: Database["public"]["Enums"]["alert_condition"]
          created_at?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          symbol: string
          target_value: number
          triggered_at?: string | null
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["alert_condition"]
          created_at?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          symbol?: string
          target_value?: number
          triggered_at?: string | null
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          id: string
          name: string
          symbol: string
        }
        Insert: {
          id?: string
          name: string
          symbol: string
        }
        Update: {
          id?: string
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          api_key: string | null
          api_secret: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          broker_name: string
          created_at: string
          error_messages: Json | null
          failed_count: number
          file_name: string
          id: string
          imported_count: number
          status: string
          user_id: string
        }
        Insert: {
          broker_name: string
          created_at?: string
          error_messages?: Json | null
          failed_count: number
          file_name: string
          id?: string
          imported_count: number
          status: string
          user_id: string
        }
        Update: {
          broker_name?: string
          created_at?: string
          error_messages?: Json | null
          failed_count?: number
          file_name?: string
          id?: string
          imported_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          created_at: string
          id: string
          pnl: number
          snapshot_date: string
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pnl: number
          snapshot_date: string
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pnl?: number
          snapshot_date?: string
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          risk_tolerance: string | null
          timezone: string | null
          trade_alerts: boolean | null
          updated_at: string
          weekly_reports: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          email_notifications?: boolean | null
          id: string
          push_notifications?: boolean | null
          risk_tolerance?: string | null
          timezone?: string | null
          trade_alerts?: boolean | null
          updated_at?: string
          weekly_reports?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          risk_tolerance?: string | null
          timezone?: string | null
          trade_alerts?: boolean | null
          updated_at?: string
          weekly_reports?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_tags: {
        Row: {
          tag_id: string
          trade_id: string
        }
        Insert: {
          tag_id: string
          trade_id: string
        }
        Update: {
          tag_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          broker_id: string | null
          created_at: string
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          expiry_date: string | null
          id: string
          notes: string | null
          option_type: Database["public"]["Enums"]["option_type"] | null
          pnl: number | null
          quantity: number
          side: Database["public"]["Enums"]["trade_side"]
          status: string
          strike_price: number | null
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          broker_id?: string | null
          created_at?: string
          entry_date: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          pnl?: number | null
          quantity: number
          side: Database["public"]["Enums"]["trade_side"]
          status?: string
          strike_price?: number | null
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          broker_id?: string | null
          created_at?: string
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          pnl?: number | null
          quantity?: number
          side?: Database["public"]["Enums"]["trade_side"]
          status?: string
          strike_price?: number | null
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          name: string
          symbols: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          symbols?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          symbols?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trade_pnl: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      alert_condition: "crosses" | "crosses_up" | "crosses_down" | "greater_than" | "less_than"
      alert_status: "active" | "triggered" | "cancelled" | "expired"
      alert_type: "price" | "volume" | "indicator"
      asset_type: "stock" | "option" | "crypto" | "futures" | "forex"
      broker_type: "webull" | "robinhood" | "schwab" | "ibkr" | "td" | "other"
      option_type: "call" | "put"
      trade_side: "buy" | "sell"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
