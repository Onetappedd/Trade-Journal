// Database function types - temporarily simplified for Vercel build
export interface DatabaseFunctions {
  [key: string]: {
    Args: any;
    Returns: any;
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
