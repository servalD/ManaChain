// Mana Chain Database Types
// Generated types for Supabase database schema

export type UserRole = 'ADMIN' | 'CLIENT' | 'BRANDUSER';
export type BrandApplicationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventNFTStatus = 'pending' | 'paid' | 'minted' | 'refunded' | 'cancelled';

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
          age_range: string;
          blockchain_address: string | null;
          verified: boolean;
          email_verification_token: string | null;
          email_verification_expires: string | null;
          is_brand: boolean;
          role: UserRole;
          last_login: string | null;
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
          age_range: string;
          blockchain_address?: string | null;
          verified?: boolean;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          is_brand?: boolean;
          role?: UserRole;
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
          age_range?: string;
          blockchain_address?: string | null;
          verified?: boolean;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          is_brand?: boolean;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          business_registration_number: string | null;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement: string | null;
          social_medias: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          business_registration_number?: string | null;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement?: string | null;
          social_medias?: Record<string, string> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          business_registration_number?: string | null;
          country?: string;
          headquarters_street?: string;
          headquarters_city?: string;
          headquarters_zip_code?: string;
          headquarters_address_complement?: string | null;
          social_medias?: Record<string, string> | null;
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
      brand_interest: {
        Row: {
          brand_id: string;
          interest_id: string;
          created_at: string;
        };
        Insert: {
          brand_id: string;
          interest_id: string;
          created_at?: string;
        };
        Update: {
          brand_id?: string;
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
      event: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          type: string;
          description: string | null;
          address_street: string | null;
          address_city: string | null;
          address_zip_code: string | null;
          address_country: string | null;
          address_complement: string | null;
          starts_at: string;
          ends_at: string | null;
          ticket_price: number;
          ticket_currency: string;
          max_tickets: number | null;
          min_token_balance: number;
          status: EventStatus;
          cover_image_url: string | null;
          nft_collection_contract_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          description?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_zip_code?: string | null;
          address_country?: string | null;
          address_complement?: string | null;
          starts_at: string;
          ends_at?: string | null;
          ticket_price?: number;
          ticket_currency?: string;
          max_tickets?: number | null;
          min_token_balance?: number;
          status?: EventStatus;
          cover_image_url?: string | null;
          nft_collection_contract_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          description?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_zip_code?: string | null;
          address_country?: string | null;
          address_complement?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          ticket_price?: number;
          ticket_currency?: string;
          max_tickets?: number | null;
          min_token_balance?: number;
          status?: EventStatus;
          cover_image_url?: string | null;
          nft_collection_contract_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_nft: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          nft_token_id: string;
          metadata_uri: string | null;
          price_paid: number;
          currency: string;
          payment_tx_hash: string | null;
          mint_tx_hash: string | null;
          status: EventNFTStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          nft_token_id: string;
          metadata_uri?: string | null;
          price_paid?: number;
          currency?: string;
          payment_tx_hash?: string | null;
          mint_tx_hash?: string | null;
          status?: EventNFTStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          nft_token_id?: string;
          metadata_uri?: string | null;
          price_paid?: number;
          currency?: string;
          payment_tx_hash?: string | null;
          mint_tx_hash?: string | null;
          status?: EventNFTStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_application: {
        Row: {
          id: string;
          contact_email: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_phone: string | null;
          brand_name: string;
          description: string | null;
          website_url: string | null;
          logo_url: string | null;
          business_registration_number: string;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement: string | null;
          motivation: string | null;
          estimated_community_size: number | null;
          social_media_links: Record<string, string> | null;
          how_did_you_hear_about_us: string | null;
          registration_proof_url: string | null;
          status: BrandApplicationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          notes: string | null;
          email_verification_token: string | null;
          email_verification_expires: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_email: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_phone?: string | null;
          brand_name: string;
          description?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          business_registration_number: string;
          country: string;
          headquarters_street: string;
          headquarters_city: string;
          headquarters_zip_code: string;
          headquarters_address_complement?: string | null;
          motivation?: string | null;
          estimated_community_size?: number | null;
          social_media_links?: Record<string, string> | null;
          how_did_you_hear_about_us?: string | null;
          registration_proof_url?: string | null;
          status?: BrandApplicationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          notes?: string | null;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contact_email?: string;
          contact_first_name?: string;
          contact_last_name?: string;
          contact_phone?: string | null;
          brand_name?: string;
          description?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          business_registration_number?: string;
          country?: string;
          headquarters_street?: string;
          headquarters_city?: string;
          headquarters_zip_code?: string;
          headquarters_address_complement?: string | null;
          motivation?: string | null;
          estimated_community_size?: number | null;
          social_media_links?: Record<string, string> | null;
          how_did_you_hear_about_us?: string | null;
          registration_proof_url?: string | null;
          status?: BrandApplicationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          notes?: string | null;
          email_verification_token?: string | null;
          email_verification_expires?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_template: {
        Row: {
          id: string;
          template_type: EmailTemplateType;
          subject: string;
          html_content: string;
          text_content: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_type: EmailTemplateType;
          subject: string;
          html_content: string;
          text_content?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_type?: EmailTemplateType;
          subject?: string;
          html_content?: string;
          text_content?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_application_interest: {
        Row: {
          brand_application_id: string;
          interest_id: string;
          created_at: string;
        };
        Insert: {
          brand_application_id: string;
          interest_id: string;
          created_at?: string;
        };
        Update: {
          brand_application_id?: string;
          interest_id?: string;
          created_at?: string;
        };
      };
      brand_like: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_id?: string;
          created_at?: string;
        };
      };
      user_ban: {
        Row: {
          id: string;
          user_id: string;
          reason: string;
          banned_by: string;
          banned_at: string;
          expires_at: string | null;
          is_permanent: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason: string;
          banned_by: string;
          banned_at?: string;
          expires_at?: string | null;
          is_permanent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reason?: string;
          banned_by?: string;
          banned_at?: string;
          expires_at?: string | null;
          is_permanent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_ban: {
        Row: {
          id: string;
          brand_id: string;
          reason: string;
          banned_by: string;
          banned_at: string;
          expires_at: string | null;
          is_permanent: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          reason: string;
          banned_by: string;
          banned_at?: string;
          expires_at?: string | null;
          is_permanent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          reason?: string;
          banned_by?: string;
          banned_at?: string;
          expires_at?: string | null;
          is_permanent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_media: {
        Row: {
          id: string;
          brand_id: string;
          image_url: string;
          ipfs_hash: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          image_url: string;
          ipfs_hash: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          image_url?: string;
          ipfs_hash?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
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

export type BrandInterest = Database['public']['Tables']['brand_interest']['Row'];
export type BrandInterestInsert = Database['public']['Tables']['brand_interest']['Insert'];
export type BrandInterestUpdate = Database['public']['Tables']['brand_interest']['Update'];

export type BrandToken = Database['public']['Tables']['brand_token']['Row'];
export type BrandTokenInsert = Database['public']['Tables']['brand_token']['Insert'];
export type BrandTokenUpdate = Database['public']['Tables']['brand_token']['Update'];

export type TokenHolder = Database['public']['Tables']['token_holder']['Row'];
export type TokenHolderInsert = Database['public']['Tables']['token_holder']['Insert'];
export type TokenHolderUpdate = Database['public']['Tables']['token_holder']['Update'];

export type TokenTransaction = Database['public']['Tables']['token_transaction']['Row'];
export type TokenTransactionInsert = Database['public']['Tables']['token_transaction']['Insert'];
export type TokenTransactionUpdate = Database['public']['Tables']['token_transaction']['Update'];

export type Event = Database['public']['Tables']['event']['Row'];
export type EventInsert = Database['public']['Tables']['event']['Insert'];
export type EventUpdate = Database['public']['Tables']['event']['Update'];

export type EventNFT = Database['public']['Tables']['event_nft']['Row'];
export type EventNFTInsert = Database['public']['Tables']['event_nft']['Insert'];
export type EventNFTUpdate = Database['public']['Tables']['event_nft']['Update'];

export type BrandApplication = Database['public']['Tables']['brand_application']['Row'];
export type BrandApplicationInsert = Database['public']['Tables']['brand_application']['Insert'];
export type BrandApplicationUpdate = Database['public']['Tables']['brand_application']['Update'];

export type EmailTemplate = Database['public']['Tables']['email_template']['Row'];
export type EmailTemplateInsert = Database['public']['Tables']['email_template']['Insert'];
export type EmailTemplateUpdate = Database['public']['Tables']['email_template']['Update'];

export type BrandLike = Database['public']['Tables']['brand_like']['Row'];
export type BrandLikeInsert = Database['public']['Tables']['brand_like']['Insert'];
export type BrandLikeUpdate = Database['public']['Tables']['brand_like']['Update'];

export type BrandApplicationInterest = Database['public']['Tables']['brand_application_interest']['Row'];
export type BrandApplicationInterestInsert = Database['public']['Tables']['brand_application_interest']['Insert'];
export type BrandApplicationInterestUpdate = Database['public']['Tables']['brand_application_interest']['Update'];

export type UserBan = Database['public']['Tables']['user_ban']['Row'];
export type UserBanInsert = Database['public']['Tables']['user_ban']['Insert'];
export type UserBanUpdate = Database['public']['Tables']['user_ban']['Update'];

export type BrandBan = Database['public']['Tables']['brand_ban']['Row'];
export type BrandBanInsert = Database['public']['Tables']['brand_ban']['Insert'];
export type BrandBanUpdate = Database['public']['Tables']['brand_ban']['Update'];

export type BrandMedia = Database['public']['Tables']['brand_media']['Row'];
export type BrandMediaInsert = Database['public']['Tables']['brand_media']['Insert'];
export type BrandMediaUpdate = Database['public']['Tables']['brand_media']['Update'];

export type EmailTemplateType = 'verification' | 'welcome' | 'password_reset' | 'brand_application_notification' | 'brand_application_approved' | 'brand_application_rejected';

export type TransactionType = 'purchase' | 'transfer' | 'reward' | 'initial_emission';
