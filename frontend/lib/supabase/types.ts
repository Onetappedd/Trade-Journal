// Database function types
export interface DatabaseFunctions {
  add_admin_user: {
    Args: {
      admin_email: string;
    };
    Returns: void;
  };
  remove_admin_user: {
    Args: {
      admin_email: string;
    };
    Returns: void;
  };
  user_has_access: {
    Args: {
      user_id: string;
      required_role: 'free' | 'pro' | 'admin';
    };
    Returns: boolean;
  };
  merge_instruments: {
    Args: {
      source_instrument_id: string;
      target_instrument_id: string;
    };
    Returns: void;
  };
  run_maintenance_cleanup: {
    Args: Record<string, never>;
    Returns: void;
  };
  compact_old_import_jobs: {
    Args: Record<string, never>;
    Returns: void;
  };
  mark_stuck_import_runs: {
    Args: Record<string, never>;
    Returns: void;
  };
  cleanup_temp_uploads: {
    Args: Record<string, never>;
    Returns: void;
  };
  cleanup_old_raw_items: {
    Args: Record<string, never>;
    Returns: void;
  };
  run_cleanup_maintenance: {
    Args: Record<string, never>;
    Returns: void;
  };
  delete_import_run_cascade: {
    Args: {
      run_id: string;
    };
    Returns: void;
  };
  compute_unique_hash: {
    Args: {
      p_symbol: string;
      p_side: string;
      p_quantity: number;
      p_price: number;
      p_timestamp: string;
      p_venue: string;
    };
    Returns: string;
  };
}

// Database table types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          role: 'free' | 'pro' | 'admin';
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at: string | null;
          subscription_ends_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: 'free' | 'pro' | 'admin';
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: 'free' | 'pro' | 'admin';
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: 'free' | 'pro' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'free' | 'pro' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'free' | 'pro' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscription_status: {
        Row: {
          id: string;
          email: string;
          role: 'free' | 'pro' | 'admin';
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at: string | null;
          subscription_ends_at: string | null;
          access_status: 'trial_active' | 'subscription_active' | 'expired';
        };
        Insert: never;
        Update: never;
      };
    };
    Views: {
      user_subscription_status: {
        Row: {
          id: string;
          email: string;
          role: 'free' | 'pro' | 'admin';
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at: string | null;
          subscription_ends_at: string | null;
          access_status: 'trial_active' | 'subscription_active' | 'expired';
        };
      };
    };
    Functions: DatabaseFunctions;
  };
}
