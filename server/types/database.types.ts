// Mana Chain Database Types
// Generated types for Supabase database schema

export interface Database {
  public: {
    Tables: {
      user: {
        Row: {
          id: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          password_hash: string;
          avatar_url: string | null;
          verified: boolean;
          email_verification_token: string | null;
          email_verification_expires: string | null;
          is_brand: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          password_hash: string;
          avatar_url?: string | null;
          verified?: boolean;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          is_brand?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          password_hash?: string;
          avatar_url?: string | null;
          verified?: boolean;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          is_brand?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          siret: string | null;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          siret?: string | null;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          siret?: string | null;
          country?: string;
          headquarters_street?: string;
          headquarters_city?: string;
          headquarters_zip_code?: string;
          headquarters_address_complement?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      interest: {
        Row: {
          id: string;
          label: string;
          icon: string | null;
        };
        Insert: {
          id: string;
          label: string;
          icon?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          icon?: string | null;
        };
      };
      user_interest: {
        Row: {
          user_id: string;
          interest_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          interest_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          interest_id?: string;
          created_at?: string;
        };
      };
      brand_token: {
        Row: {
          id: string;
          brand_id: string;
          symbol: string;
          total_supply: number;
          current_price: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          symbol: string;
          total_supply?: number;
          current_price?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          symbol?: string;
          total_supply?: number;
          current_price?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      token_holder: {
        Row: {
          id: string;
          user_id: string;
          token_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_id?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      token_transaction: {
        Row: {
          id: string;
          token_id: string;
          from_user_id: string | null;
          to_user_id: string;
          amount: number;
          price_per_token: string | null;
          transaction_type: 'purchase' | 'transfer' | 'reward' | 'initial_emission';
          created_at: string;
        };
        Insert: {
          id?: string;
          token_id: string;
          from_user_id?: string | null;
          to_user_id: string;
          amount: number;
          price_per_token?: string | null;
          transaction_type: 'purchase' | 'transfer' | 'reward' | 'initial_emission';
          created_at?: string;
        };
        Update: {
          id?: string;
          token_id?: string;
          from_user_id?: string | null;
          to_user_id?: string;
          amount?: number;
          price_per_token?: string | null;
          transaction_type?: 'purchase' | 'transfer' | 'reward' | 'initial_emission';
          created_at?: string;
        };
      };
    };
  };
}

// Helper types for easier usage
export type User = Database['public']['Tables']['user']['Row'];
export type UserInsert = Database['public']['Tables']['user']['Insert'];
export type UserUpdate = Database['public']['Tables']['user']['Update'];

export type Brand = Database['public']['Tables']['brand']['Row'];
export type BrandInsert = Database['public']['Tables']['brand']['Insert'];
export type BrandUpdate = Database['public']['Tables']['brand']['Update'];

export type Interest = Database['public']['Tables']['interest']['Row'];
export type InterestInsert = Database['public']['Tables']['interest']['Insert'];
export type InterestUpdate = Database['public']['Tables']['interest']['Update'];

export type UserInterest = Database['public']['Tables']['user_interest']['Row'];
export type UserInterestInsert = Database['public']['Tables']['user_interest']['Insert'];
export type UserInterestUpdate = Database['public']['Tables']['user_interest']['Update'];

export type BrandToken = Database['public']['Tables']['brand_token']['Row'];
export type BrandTokenInsert = Database['public']['Tables']['brand_token']['Insert'];
export type BrandTokenUpdate = Database['public']['Tables']['brand_token']['Update'];

export type TokenHolder = Database['public']['Tables']['token_holder']['Row'];
export type TokenHolderInsert = Database['public']['Tables']['token_holder']['Insert'];
export type TokenHolderUpdate = Database['public']['Tables']['token_holder']['Update'];

export type TokenTransaction = Database['public']['Tables']['token_transaction']['Row'];
export type TokenTransactionInsert = Database['public']['Tables']['token_transaction']['Insert'];
export type TokenTransactionUpdate = Database['public']['Tables']['token_transaction']['Update'];

export type TransactionType = 'purchase' | 'transfer' | 'reward' | 'initial_emission';
