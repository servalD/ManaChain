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
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  is_brand BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for searches
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_email_verification_token ON "user"(email_verification_token);
CREATE INDEX idx_user_is_brand ON "user"(is_brand);

-- Table: brand (brand information)
CREATE TABLE IF NOT EXISTS brand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE RESTRICT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  business_registration_number TEXT UNIQUE,
  country TEXT NOT NULL,
  headquarters_street TEXT NOT NULL,
  headquarters_city TEXT NOT NULL,
  headquarters_zip_code TEXT NOT NULL,
  headquarters_address_complement TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for searches
CREATE INDEX idx_brand_name ON brand(name);
CREATE INDEX idx_brand_user_id ON brand(user_id);
CREATE INDEX idx_brand_interest_id ON brand(interest_id);
CREATE INDEX idx_brand_verified ON brand(verified);

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
  ('automotive', 'Automotive', '🚗')
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE "user" IS 'Regular users and brand accounts';
COMMENT ON TABLE brand IS 'Brand information';
COMMENT ON TABLE interest IS 'Available interests';
COMMENT ON TABLE user_interest IS 'Many-to-many relationship between users and interests';
COMMENT ON TABLE brand_token IS 'Tokens issued by brands (represents a fractionalized NFT)';
COMMENT ON TABLE token_holder IS 'Token holders and their balances';
COMMENT ON TABLE token_transaction IS 'History of all token transactions';

COMMENT ON COLUMN "user".verified IS 'Indicates if the user email has been verified';
COMMENT ON COLUMN "user".email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN "user".email_verification_expires IS 'Expiration date of verification token';
COMMENT ON COLUMN "user".is_brand IS 'Indicates if the account is associated with a brand';
COMMENT ON COLUMN brand.interest_id IS 'Primary interest category of the brand (links to interest table)';
COMMENT ON COLUMN brand.business_registration_number IS 'Business registration number (SIRET in France, EIN in USA, etc.)';
COMMENT ON COLUMN brand.verified IS 'Indicates if the brand has been verified by the team';
COMMENT ON COLUMN brand_token.total_supply IS 'Total supply of fractional tokens (supports decimals)';
COMMENT ON COLUMN brand_token.nft_token_id IS 'Token ID of the original NFT that was fractionalized';
COMMENT ON COLUMN brand_token.nft_name IS 'Name of the original NFT';
COMMENT ON COLUMN brand_token.nft_symbol IS 'Symbol of the original NFT';
COMMENT ON COLUMN token_holder.balance IS 'Fractional token balance (supports decimals with 8 decimal places)';
COMMENT ON COLUMN token_transaction.amount IS 'Amount of tokens transferred (supports decimals with 8 decimal places)';
COMMENT ON COLUMN token_transaction.from_user_id IS 'NULL for initial emissions';
COMMENT ON COLUMN token_transaction.transaction_type IS 'Type: purchase, transfer, reward, or initial_emission';
