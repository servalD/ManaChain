-- Mana Chain Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user (regular users and brand accounts)
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  age_range TEXT NOT NULL,
  blockchain_address TEXT UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  is_brand BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_age_range CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')),
  CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'CLIENT', 'BRANDUSER'))
);

-- Indexes for searches
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_email_verification_token ON "user"(email_verification_token);
CREATE INDEX idx_user_is_brand ON "user"(is_brand);
CREATE INDEX idx_user_blockchain_address ON "user"(blockchain_address);
CREATE INDEX idx_user_role ON "user"(role);

-- Table: brand (brand information)
CREATE TABLE IF NOT EXISTS brand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  business_registration_number TEXT UNIQUE,
  country TEXT NOT NULL,
  headquarters_street TEXT NOT NULL,
  headquarters_city TEXT NOT NULL,
  headquarters_zip_code TEXT NOT NULL,
  headquarters_address_complement TEXT,
  social_medias JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for searches
CREATE INDEX idx_brand_name ON brand(name);
CREATE INDEX idx_brand_user_id ON brand(user_id);

-- Table: interest (available interests)
CREATE TABLE IF NOT EXISTS interest (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT
);

-- Indexes for searches
CREATE INDEX idx_interest_label ON interest(label);

-- Table: user_interest (many-to-many relationship between users and interests)
CREATE TABLE IF NOT EXISTS user_interest (
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, interest_id)
);

-- Indexes for searches
CREATE INDEX idx_user_interest_user_id ON user_interest(user_id);
CREATE INDEX idx_user_interest_interest_id ON user_interest(interest_id);

-- Table: brand_interest (many-to-many relationship between brands and interests)
CREATE TABLE IF NOT EXISTS brand_interest (
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_id, interest_id)
);

-- Indexes for searches
CREATE INDEX idx_brand_interest_brand_id ON brand_interest(brand_id);
CREATE INDEX idx_brand_interest_interest_id ON brand_interest(interest_id);

-- Table: brand_token (tokens issued by brands - represents a fractionalized NFT)
CREATE TABLE IF NOT EXISTS brand_token (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL UNIQUE REFERENCES brand(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL UNIQUE,
  total_supply DECIMAL(20, 8) NOT NULL DEFAULT 0,
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  
  -- NFT Information (the NFT that was fractionalized into these tokens)
  nft_token_id TEXT,
  nft_name TEXT,
  nft_symbol TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_total_supply_positive CHECK (total_supply >= 0),
  CONSTRAINT chk_current_price_positive CHECK (current_price >= 0)
);

-- Indexes for searches
CREATE INDEX idx_brand_token_brand_id ON brand_token(brand_id);
CREATE INDEX idx_brand_token_symbol ON brand_token(symbol);
CREATE INDEX idx_brand_token_nft_token_id ON brand_token(nft_token_id);

-- Table: token_holder (token holders and their balances)
CREATE TABLE IF NOT EXISTS token_holder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES brand_token(id) ON DELETE CASCADE,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_balance_positive CHECK (balance >= 0),
  UNIQUE (user_id, token_id)
);

-- Indexes for searches
CREATE INDEX idx_token_holder_user_id ON token_holder(user_id);
CREATE INDEX idx_token_holder_token_id ON token_holder(token_id);
CREATE INDEX idx_token_holder_balance ON token_holder(balance DESC);

-- Table: token_transaction (transaction history)
CREATE TABLE IF NOT EXISTS token_transaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES brand_token(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
  to_user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  transaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('purchase', 'transfer', 'reward', 'initial_emission'))
);

-- Indexes for searches
CREATE INDEX idx_token_transaction_token_id ON token_transaction(token_id, created_at DESC);
CREATE INDEX idx_token_transaction_from_user_id ON token_transaction(from_user_id);
CREATE INDEX idx_token_transaction_to_user_id ON token_transaction(to_user_id);
CREATE INDEX idx_token_transaction_type ON token_transaction(transaction_type);

-- Table: event (brand events for token holders - represents an NFT collection)
CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address_street TEXT,
  address_city TEXT,
  address_zip_code TEXT,
  address_country TEXT,
  address_complement TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  ticket_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  ticket_currency TEXT NOT NULL DEFAULT 'ETH',
  max_tickets INTEGER,
  min_token_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_image_url TEXT,
  nft_collection_contract_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_ticket_price_positive CHECK (ticket_price >= 0),
  CONSTRAINT chk_event_min_token_balance_positive CHECK (min_token_balance >= 0),
  CONSTRAINT chk_event_max_tickets_positive CHECK (max_tickets IS NULL OR max_tickets >= 0),
  CONSTRAINT chk_event_status CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  CONSTRAINT chk_event_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

-- Indexes for searches
CREATE INDEX idx_event_brand_id ON event(brand_id);
CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_starts_at ON event(starts_at);

-- Table: event_nft (individual NFTs from the event collection)
CREATE TABLE IF NOT EXISTS event_nft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  -- NFT Information (token ID within the collection)
  nft_token_id TEXT NOT NULL,
  metadata_uri TEXT,
  price_paid DECIMAL(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ETH',
  payment_tx_hash TEXT,
  mint_tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_nft_price_paid_positive CHECK (price_paid >= 0),
  CONSTRAINT chk_event_nft_status CHECK (status IN ('pending', 'paid', 'minted', 'refunded', 'cancelled')),
  -- Ensure unique token_id per event (each NFT in a collection has a unique token ID)
  UNIQUE (event_id, nft_token_id)
);

-- Indexes for searches
CREATE INDEX idx_event_nft_event_id ON event_nft(event_id);
CREATE INDEX idx_event_nft_user_id ON event_nft(user_id);
CREATE INDEX idx_event_nft_status ON event_nft(status);
CREATE INDEX idx_event_nft_created_at ON event_nft(created_at DESC);
CREATE INDEX idx_event_nft_token_id ON event_nft(event_id, nft_token_id);
CREATE INDEX idx_event_nft_collection_contract ON event(nft_collection_contract_address);

-- Table: brand_application (brand registration applications)
CREATE TABLE IF NOT EXISTS brand_application (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Contact Information
  contact_email TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_phone TEXT,
  -- Brand Information
  brand_name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  -- Legal Information
  business_registration_number TEXT NOT NULL,
  country TEXT NOT NULL,
  headquarters_street TEXT NOT NULL,
  headquarters_city TEXT NOT NULL,
  headquarters_zip_code TEXT NOT NULL,
  headquarters_address_complement TEXT,
  -- Additional Information
  motivation TEXT,
  estimated_community_size INTEGER,
  social_media_links JSONB,
  how_did_you_hear_about_us TEXT,
  -- Documents
  registration_proof_url TEXT,
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  -- Email Verification
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_brand_application_status CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  CONSTRAINT chk_brand_application_community_size_positive CHECK (estimated_community_size IS NULL OR estimated_community_size >= 0)
);

-- Indexes for searches
CREATE INDEX idx_brand_application_status ON brand_application(status);
CREATE INDEX idx_brand_application_contact_email ON brand_application(contact_email);
CREATE INDEX idx_brand_application_brand_name ON brand_application(brand_name);
CREATE INDEX idx_brand_application_created_at ON brand_application(created_at DESC);
CREATE INDEX idx_brand_application_reviewed_by ON brand_application(reviewed_by);
CREATE INDEX idx_brand_application_email_verification_token ON brand_application(email_verification_token);

-- Table: brand_like (likes from users to brands)
CREATE TABLE IF NOT EXISTS brand_like (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Indexes for searches
CREATE INDEX idx_brand_like_user_id ON brand_like(user_id);
CREATE INDEX idx_brand_like_brand_id ON brand_like(brand_id);
CREATE INDEX idx_brand_like_created_at ON brand_like(created_at DESC);

-- Comments
COMMENT ON TABLE brand_like IS 'Tracks which users have liked which brands';
COMMENT ON COLUMN brand_like.user_id IS 'User who liked the brand';
COMMENT ON COLUMN brand_like.brand_id IS 'Brand that was liked';
COMMENT ON COLUMN brand_like.created_at IS 'When the like was created';

-- Table: brand_application_interest (many-to-many relationship between brand applications and interests)
CREATE TABLE IF NOT EXISTS brand_application_interest (
  brand_application_id UUID NOT NULL REFERENCES brand_application(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_application_id, interest_id)
);

-- Indexes for searches
CREATE INDEX idx_brand_application_interest_app_id ON brand_application_interest(brand_application_id);
CREATE INDEX idx_brand_application_interest_interest_id ON brand_application_interest(interest_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_updated_at
  BEFORE UPDATE ON brand
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_token_updated_at
  BEFORE UPDATE ON brand_token
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_holder_updated_at
  BEFORE UPDATE ON token_holder
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_updated_at
  BEFORE UPDATE ON event
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_nft_updated_at
  BEFORE UPDATE ON event_nft
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_application_updated_at
  BEFORE UPDATE ON brand_application
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default interests
INSERT INTO interest (id, label, icon) VALUES
  ('fashion', 'Fashion', '👗'),
  ('tech', 'Technology', '💻'),
  ('sport', 'Sports', '⚽'),
  ('music', 'Music', '🎵'),
  ('art', 'Art', '🎨'),
  ('food', 'Food & Beverage', '🍔'),
  ('travel', 'Travel', '✈️'),
  ('gaming', 'Gaming', '🎮'),
  ('beauty', 'Beauty', '💄'),
  ('health', 'Health & Wellness', '🏥'),
  ('education', 'Education', '📚'),
  ('environment', 'Environment', '🌱'),
  ('finance', 'Finance', '💰'),
  ('entertainment', 'Entertainment', '🎬'),
  ('automotive', 'Automotive', '🚗'),
  ('nightlife', 'Nightlife', '🍸')
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE "user" IS 'Regular users and brand accounts';
COMMENT ON TABLE brand IS 'Brand information';
COMMENT ON TABLE interest IS 'Available interests';
COMMENT ON TABLE user_interest IS 'Many-to-many relationship between users and interests';
COMMENT ON TABLE brand_interest IS 'Many-to-many relationship between brands and interests';
COMMENT ON TABLE brand_token IS 'Tokens issued by brands (represents a fractionalized NFT)';
COMMENT ON TABLE token_holder IS 'Token holders and their balances';
COMMENT ON TABLE token_transaction IS 'History of all token transactions';
COMMENT ON TABLE event IS 'Brand events for token holders (represents an NFT collection)';
COMMENT ON TABLE event_nft IS 'Individual NFTs from the event collection (tickets)';
COMMENT ON TABLE brand_application IS 'Brand registration applications awaiting approval';
COMMENT ON TABLE brand_application_interest IS 'Many-to-many relationship between brand applications and interests (max 2 per application)';

COMMENT ON COLUMN "user".age_range IS 'Age range of the user (required, values: 18-24, 25-34, 35-44, 45-54, 55-64, 65+)';
COMMENT ON COLUMN "user".verified IS 'Indicates if the user email has been verified';
COMMENT ON COLUMN "user".email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN "user".email_verification_expires IS 'Expiration date of verification token';
COMMENT ON COLUMN "user".is_brand IS 'Indicates if the account is associated with a brand';
COMMENT ON COLUMN "user".role IS 'User role: admin (platform administrators), client (regular users), branduser (users who own a brand)';
COMMENT ON COLUMN brand.business_registration_number IS 'Business registration number (SIRET in France, EIN in USA, etc.)';
COMMENT ON COLUMN brand.social_medias IS 'JSON object containing social media links (e.g., {twitter: "...", instagram: "...", linkedin: "..."})';
COMMENT ON COLUMN brand_token.total_supply IS 'Total supply of fractional tokens (supports decimals)';
COMMENT ON COLUMN brand_token.nft_token_id IS 'Token ID of the original NFT that was fractionalized';
COMMENT ON COLUMN brand_token.nft_name IS 'Name of the original NFT';
COMMENT ON COLUMN brand_token.nft_symbol IS 'Symbol of the original NFT';
COMMENT ON COLUMN token_holder.balance IS 'Fractional token balance (supports decimals with 8 decimal places)';
COMMENT ON COLUMN token_transaction.amount IS 'Amount of tokens transferred (supports decimals with 8 decimal places)';
COMMENT ON COLUMN token_transaction.from_user_id IS 'NULL for initial emissions';
COMMENT ON COLUMN token_transaction.transaction_type IS 'Type: purchase, transfer, reward, or initial_emission';
COMMENT ON COLUMN event.brand_id IS 'Brand creating the event (token can be retrieved via brand -> brand_token relation)';
COMMENT ON COLUMN event.address_street IS 'Event address street (optional)';
COMMENT ON COLUMN event.address_city IS 'Event address city (optional)';
COMMENT ON COLUMN event.address_zip_code IS 'Event address ZIP/postal code (optional)';
COMMENT ON COLUMN event.address_country IS 'Event address country (optional)';
COMMENT ON COLUMN event.address_complement IS 'Event address complement (optional, e.g. floor/building)';
COMMENT ON COLUMN event.ticket_price IS 'Ticket price for minting an NFT from the collection';
COMMENT ON COLUMN event.max_tickets IS 'Maximum number of tickets available (NULL = unlimited)';
COMMENT ON COLUMN event.min_token_balance IS 'Minimum token balance required to participate';
COMMENT ON COLUMN event.nft_collection_contract_address IS 'Smart contract address of the NFT collection';
COMMENT ON COLUMN event.nft_collection_name IS 'Name of the NFT collection';
COMMENT ON COLUMN event.nft_collection_symbol IS 'Symbol of the NFT collection';
COMMENT ON COLUMN event.nft_collection_base_uri IS 'Base URI for NFT metadata';
COMMENT ON COLUMN event_nft.event_id IS 'Reference to the event (NFT collection)';
COMMENT ON COLUMN event_nft.nft_token_id IS 'Token ID within the collection (unique per event)';
COMMENT ON COLUMN event_nft.status IS 'Minting status: pending, paid, minted, refunded, cancelled';
COMMENT ON COLUMN brand_application.contact_email IS 'Email address of the contact person';
COMMENT ON COLUMN brand_application.contact_first_name IS 'First name of the contact person';
COMMENT ON COLUMN brand_application.contact_last_name IS 'Last name of the contact person';
COMMENT ON COLUMN brand_application.brand_name IS 'Name of the brand applying';
COMMENT ON COLUMN brand_application.business_registration_number IS 'Business registration number (SIRET, EIN, etc.)';
COMMENT ON COLUMN brand_application.motivation IS 'Reason why the brand wants to join the platform';
COMMENT ON COLUMN brand_application.estimated_community_size IS 'Estimated size of current community/followers';
COMMENT ON COLUMN brand_application.social_media_links IS 'JSON object containing social media links';
COMMENT ON COLUMN brand_application.how_did_you_hear_about_us IS 'How the brand discovered the platform (e.g., social media, referral, search engine, etc.)';
COMMENT ON COLUMN brand_application.registration_proof_url IS 'URL to proof of business registration document';
COMMENT ON COLUMN brand_application.status IS 'Application status: pending, approved, rejected, needs_review';
COMMENT ON COLUMN brand_application.reviewed_by IS 'ID of the admin user who reviewed the application';
COMMENT ON COLUMN brand_application.reviewed_at IS 'Timestamp when the application was reviewed';
COMMENT ON COLUMN brand_application.rejection_reason IS 'Reason for rejection if application was rejected';
COMMENT ON COLUMN brand_application.notes IS 'Internal notes for the review team';

-- Table: email_template (email templates stored in database)
CREATE TABLE IF NOT EXISTS email_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_email_template_type CHECK (template_type IN (
    'verification',
    'welcome',
    'password_reset',
    'brand_application_notification',
    'brand_application_approved',
    'brand_application_rejected'
  ))
);

-- Indexes for searches
CREATE INDEX idx_email_template_type ON email_template(template_type);

-- Triggers for updated_at
CREATE TRIGGER update_email_template_updated_at
  BEFORE UPDATE ON email_template
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE email_template IS 'Email templates stored in database for dynamic email content';
COMMENT ON COLUMN email_template.template_type IS 'Type of email template: verification, welcome, password_reset, brand_application_notification, brand_application_approved, brand_application_rejected';
COMMENT ON COLUMN email_template.subject IS 'Email subject line (can contain placeholders like {{username}})';
COMMENT ON COLUMN email_template.html_content IS 'HTML content of the email (can contain placeholders like {{username}}, {{link}})';
COMMENT ON COLUMN email_template.text_content IS 'Plain text version of the email (optional, for email clients that do not support HTML)';
COMMENT ON COLUMN email_template.description IS 'Description of when this template is used';