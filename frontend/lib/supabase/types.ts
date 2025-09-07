export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string | null
          email: string | null
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billing_events: {
        Row: {
          payload: Json
          received_at: string | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          payload: Json
          received_at?: string | null
          stripe_event_id: string
          type: string
        }
        Update: {
          payload?: Json
          received_at?: string | null
          stripe_event_id?: string
          type?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          price_id: string
          status: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          price_id: string
          status: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          price_id?: string
          status?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      broker_accounts: {
        Row: {
          access_token_enc: string | null
          account_ids: Json | null
          broker: string
          connected_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          label: string
          refresh_token_enc: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_enc?: string | null
          account_ids?: Json | null
          broker: string
          connected_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          label: string
          refresh_token_enc?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_enc?: string | null
          account_ids?: Json | null
          broker?: string
          connected_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          label?: string
          refresh_token_enc?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      corporate_actions: {
        Row: {
          created_at: string | null
          effective_date: string
          factor: number | null
          id: string
          memo_url: string | null
          payload: Json | null
          symbol: string
          type: string
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          factor?: number | null
          id?: string
          memo_url?: string | null
          payload?: Json | null
          symbol: string
          type: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          factor?: number | null
          id?: string
          memo_url?: string | null
          payload?: Json | null
          symbol?: string
          type?: string
        }
        Relationships: []
      }
      executions_normalized: {
        Row: {
          broker_account_id: string | null
          created_at: string | null
          currency: string | null
          exec_id: string | null
          expiry: string | null
          fees: number | null
          futures_symbol: string | null
          id: string
          instrument_type: string
          multiplier: number | null
          notes: string | null
          occ_symbol: string | null
          option_type: string | null
          order_id: string | null
          price: number
          quantity: number
          side: string
          source_import_run_id: string | null
          strike: number | null
          symbol: string
          timestamp: string
          underlying: string | null
          unique_hash: string | null
          user_id: string
          venue: string | null
        }
        Insert: {
          broker_account_id?: string | null
          created_at?: string | null
          currency?: string | null
          exec_id?: string | null
          expiry?: string | null
          fees?: number | null
          futures_symbol?: string | null
          id?: string
          instrument_type: string
          multiplier?: number | null
          notes?: string | null
          occ_symbol?: string | null
          option_type?: string | null
          order_id?: string | null
          price: number
          quantity: number
          side: string
          source_import_run_id?: string | null
          strike?: number | null
          symbol: string
          timestamp: string
          underlying?: string | null
          unique_hash?: string | null
          user_id: string
          venue?: string | null
        }
        Update: {
          broker_account_id?: string | null
          created_at?: string | null
          currency?: string | null
          exec_id?: string | null
          expiry?: string | null
          fees?: number | null
          futures_symbol?: string | null
          id?: string
          instrument_type?: string
          multiplier?: number | null
          notes?: string | null
          occ_symbol?: string | null
          option_type?: string | null
          order_id?: string | null
          price?: number
          quantity?: number
          side?: string
          source_import_run_id?: string | null
          strike?: number | null
          symbol?: string
          timestamp?: string
          underlying?: string | null
          unique_hash?: string | null
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "executions_normalized_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executions_normalized_source_import_run_id_fkey"
            columns: ["source_import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executions_normalized_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      import_job_progress: {
        Row: {
          created_at: string | null
          id: string
          import_run_id: string
          job_id: string
          processed_rows: number | null
          status: string | null
          total_rows: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_run_id: string
          job_id: string
          processed_rows?: number | null
          status?: string | null
          total_rows: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          import_run_id?: string
          job_id?: string
          processed_rows?: number | null
          status?: string | null
          total_rows?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_progress_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      import_mapping_presets: {
        Row: {
          broker_hint: string | null
          created_at: string | null
          fields: Json
          file_glob: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker_hint?: string | null
          created_at?: string | null
          fields: Json
          file_glob?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker_hint?: string | null
          created_at?: string | null
          fields?: Json
          file_glob?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_runs: {
        Row: {
          broker_account_id: string | null
          created_at: string | null
          error: string | null
          finished_at: string | null
          id: string
          source: string
          started_at: string | null
          status: string
          summary: Json | null
          user_id: string
        }
        Insert: {
          broker_account_id?: string | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          source: string
          started_at?: string | null
          status?: string
          summary?: Json | null
          user_id: string
        }
        Update: {
          broker_account_id?: string | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          source?: string
          started_at?: string | null
          status?: string
          summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_runs_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          created_at: string
          failed_count: number
          file_name: string
          id: string
          inserted_count: number
          row_count: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_count?: number
          file_name: string
          id?: string
          inserted_count?: number
          row_count?: number
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_count?: number
          file_name?: string
          id?: string
          inserted_count?: number
          row_count?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      instrument_aliases: {
        Row: {
          alias_symbol: string
          created_at: string | null
          id: string
          instrument_id: string
          source: string
        }
        Insert: {
          alias_symbol: string
          created_at?: string | null
          id?: string
          instrument_id: string
          source: string
        }
        Update: {
          alias_symbol?: string
          created_at?: string | null
          id?: string
          instrument_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "instrument_aliases_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          created_at: string | null
          exchange: string | null
          id: string
          instrument_type: string
          meta: Json | null
          multiplier: number | null
          unique_symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exchange?: string | null
          id?: string
          instrument_type: string
          meta?: Json | null
          multiplier?: number | null
          unique_symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exchange?: string | null
          id?: string
          instrument_type?: string
          meta?: Json | null
          multiplier?: number | null
          unique_symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      option_scenarios: {
        Row: {
          created_at: string
          expiry: string | null
          id: string
          iv: number
          method: string
          multiplier: number
          name: string | null
          q: number
          r: number
          s: number
          strike: number
          symbol: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry?: string | null
          id?: string
          iv: number
          method: string
          multiplier?: number
          name?: string | null
          q: number
          r: number
          s: number
          strike: number
          symbol?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry?: string | null
          id?: string
          iv?: number
          method?: string
          multiplier?: number
          name?: string | null
          q?: number
          r?: number
          s?: number
          strike?: number
          symbol?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_scenarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      raw_import_items: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          import_run_id: string
          raw_payload: Json
          source_line: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          import_run_id: string
          raw_payload: Json
          source_line: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          import_run_id?: string
          raw_payload?: Json
          source_line?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_import_items_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_import_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_scans: {
        Row: {
          created_at: string | null
          id: string
          name: string
          params: Json
          slug: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          params: Json
          slug: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          params?: Json
          slug?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      symbol_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          symbol: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          symbol: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          symbol?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symbol_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      temp_uploads: {
        Row: {
          created_at: string | null
          expires_at: string
          file_type: string
          filename: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          file_type: string
          filename: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          file_type?: string
          filename?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temp_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trades: {
        Row: {
          avg_close_price: number | null
          avg_open_price: number
          closed_at: string | null
          created_at: string | null
          fees: number | null
          group_key: string
          id: string
          ingestion_run_id: string | null
          instrument_type: string
          legs: Json | null
          opened_at: string
          qty_closed: number | null
          qty_opened: number
          realized_pnl: number | null
          row_hash: string | null
          status: string
          symbol: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_close_price?: number | null
          avg_open_price: number
          closed_at?: string | null
          created_at?: string | null
          fees?: number | null
          group_key: string
          id?: string
          ingestion_run_id?: string | null
          instrument_type: string
          legs?: Json | null
          opened_at: string
          qty_closed?: number | null
          qty_opened: number
          realized_pnl?: number | null
          row_hash?: string | null
          status?: string
          symbol: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_close_price?: number | null
          avg_open_price?: number
          closed_at?: string | null
          created_at?: string | null
          fees?: number | null
          group_key?: string
          id?: string
          ingestion_run_id?: string | null
          instrument_type?: string
          legs?: Json | null
          opened_at?: string
          qty_closed?: number | null
          qty_opened?: number
          realized_pnl?: number | null
          row_hash?: string | null
          status?: string
          symbol?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_prefs: {
        Row: {
          created_at: string
          id: string
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
      watchlist_items: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          source: string | null
          symbol: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          source?: string | null
          symbol: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          source?: string | null
          symbol?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_entitlements: {
        Row: {
          is_premium: boolean | null
          user_id: string | null
        }
        Insert: {
          is_premium?: never
          user_id?: string | null
        }
        Update: {
          is_premium?: never
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscription_status: {
        Row: {
          access_status: string | null
          email: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
        }
        Insert: {
          access_status?: never
          email?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
        }
        Update: {
          access_status?: never
          email?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_entitlements"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      add_admin_user: {
        Args: { admin_email: string }
        Returns: undefined
      }
      cleanup_expired_temp_uploads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      compute_execution_hash: {
        Args: {
          p_broker_account_id: string
          p_price: number
          p_quantity: number
          p_side: string
          p_symbol: string
          p_timestamp: string
        }
        Returns: string
      }
      remove_admin_user: {
        Args: { admin_email: string }
        Returns: undefined
      }
      user_has_access: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      subscription_status: "trial" | "active" | "cancelled" | "expired"
      user_role: "free" | "pro" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: ["trial", "active", "cancelled", "expired"],
      user_role: ["free", "pro", "admin"],
    },
  },
} as const