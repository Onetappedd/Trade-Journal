export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          timezone: string | null
          notifications_enabled: boolean
          theme: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          timezone?: string | null
          notifications_enabled?: boolean
          theme?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          timezone?: string | null
          notifications_enabled?: boolean
          theme?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          asset_type: "stock" | "option" | "crypto" | "futures" | "forex"
          side: "buy" | "sell"
          quantity: number
          entry_price: number
          exit_price: number | null
          entry_date: string
          exit_date: string | null
          notes: string | null
          status: "open" | "closed"
          created_at: string
          updated_at: string
          strike_price: number | null
          expiry_date: string | null
          option_type: "call" | "put" | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          asset_type: "stock" | "option" | "crypto" | "futures" | "forex"
          side: "buy" | "sell"
          quantity: number
          entry_price: number
          exit_price?: number | null
          entry_date: string
          exit_date?: string | null
          notes?: string | null
          status?: "open" | "closed"
          created_at?: string
          updated_at?: string
          strike_price?: number | null
          expiry_date?: string | null
          option_type?: "call" | "put" | null
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          asset_type?: "stock" | "option" | "crypto" | "futures" | "forex"
          side?: "buy" | "sell"
          quantity?: number
          entry_price?: number
          exit_price?: number | null
          entry_date?: string
          exit_date?: string | null
          notes?: string | null
          status?: "open" | "closed"
          created_at?: string
          updated_at?: string
          strike_price?: number | null
          expiry_date?: string | null
          option_type?: "call" | "put" | null
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
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          color?: string | null
          created_at?: string
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
          id: string
          trade_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
