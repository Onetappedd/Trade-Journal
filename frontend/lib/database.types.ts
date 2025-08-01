export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          symbol: string
          target_value: number | null
          triggered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          symbol: string
          target_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          symbol?: string
          target_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_asset_type: string | null
          default_broker: string | null
          display_name: string | null
          email: string
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          risk_tolerance: string | null
          timezone: string | null
          trade_alerts: boolean | null
          updated_at: string | null
          weekly_reports: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_asset_type?: string | null
          default_broker?: string | null
          display_name?: string | null
          email: string
          email_notifications?: boolean | null
          id: string
          push_notifications?: boolean | null
          risk_tolerance?: string | null
          timezone?: string | null
          trade_alerts?: boolean | null
          updated_at?: string | null
          weekly_reports?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_asset_type?: string | null
          default_broker?: string | null
          display_name?: string | null
          email?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          risk_tolerance?: string | null
          timezone?: string | null
          trade_alerts?: boolean | null
          updated_at?: string | null
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
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
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
          created_at: string | null
          id: string
          tag_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          trade_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
          asset_type: string
          broker: string
          created_at: string | null
          emotional_state: string | null
          execution_quality: number | null
          exit_reason: string | null
          fees: number | null
          holding_period_days: number | null
          id: string
          lessons_learned: string | null
          market_conditions: string | null
          notes: string | null
          price: number
          profit_loss: number | null
          profit_loss_percentage: number | null
          quantity: number
          setup_quality: number | null
          side: string
          strategy: string | null
          symbol: string
          total_value: number
          trade_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          broker: string
          created_at?: string | null
          emotional_state?: string | null
          execution_quality?: number | null
          exit_reason?: string | null
          fees?: number | null
          holding_period_days?: number | null
          id?: string
          lessons_learned?: string | null
          market_conditions?: string | null
          notes?: string | null
          price: number
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          quantity: number
          setup_quality?: number | null
          side: string
          strategy?: string | null
          symbol: string
          total_value: number
          trade_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          broker?: string
          created_at?: string | null
          emotional_state?: string | null
          execution_quality?: number | null
          exit_reason?: string | null
          fees?: number | null
          holding_period_days?: number | null
          id?: string
          lessons_learned?: string | null
          market_conditions?: string | null
          notes?: string | null
          price?: number
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          quantity?: number
          setup_quality?: number | null
          side?: string
          strategy?: string | null
          symbol?: string
          total_value?: number
          trade_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_items: {
        Row: {
          alert_price: number | null
          created_at: string | null
          id: string
          notes: string | null
          symbol: string
          target_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_price?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          symbol: string
          target_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_price?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          symbol?: string
          target_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_user_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
