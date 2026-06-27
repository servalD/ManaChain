import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration baseline : reproduit l'intégralité du schéma ManaChain existant
 * (port de `server/SQL/init.sql` + colonne `password_changed` de la migration
 * 002). Devient la nouvelle source de vérité du schéma sous TypeORM.
 *
 * À exécuter sur une base VIERGE (`pnpm migration:run`). Contre la base Supabase
 * existante — où ces tables existent déjà — NE PAS exécuter : enregistrer plutôt
 * la migration comme déjà appliquée. Les `COMMENT ON` purement documentaires de
 * init.sql sont volontairement omis (sans impact fonctionnel). Le seed des
 * `email_template` est différé au jalon `auth`.
 */
export class BaselineSchema1750000000000 implements MigrationInterface {
  name = 'BaselineSchema1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  is_brand BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'CLIENT',
  password_changed BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_age_range CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')),
  CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'CLIENT', 'BRANDUSER'))
);
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_email_verification_token ON "user"(email_verification_token);
CREATE INDEX idx_user_password_reset_token ON "user"(password_reset_token);
CREATE INDEX idx_user_is_brand ON "user"(is_brand);
CREATE INDEX idx_user_blockchain_address ON "user"(blockchain_address);
CREATE INDEX idx_user_role ON "user"(role);

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
CREATE INDEX idx_brand_name ON brand(name);
CREATE INDEX idx_brand_user_id ON brand(user_id);

CREATE TABLE IF NOT EXISTS interest (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT
);
CREATE INDEX idx_interest_label ON interest(label);

CREATE TABLE IF NOT EXISTS user_interest (
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, interest_id)
);
CREATE INDEX idx_user_interest_user_id ON user_interest(user_id);
CREATE INDEX idx_user_interest_interest_id ON user_interest(interest_id);

CREATE TABLE IF NOT EXISTS brand_interest (
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_id, interest_id)
);
CREATE INDEX idx_brand_interest_brand_id ON brand_interest(brand_id);
CREATE INDEX idx_brand_interest_interest_id ON brand_interest(interest_id);

CREATE TABLE IF NOT EXISTS brand_token (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL UNIQUE REFERENCES brand(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL UNIQUE,
  total_supply DECIMAL(20, 8) NOT NULL DEFAULT 0,
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0,
  nft_token_id TEXT,
  nft_name TEXT,
  nft_symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_total_supply_positive CHECK (total_supply >= 0),
  CONSTRAINT chk_current_price_positive CHECK (current_price >= 0)
);
CREATE INDEX idx_brand_token_brand_id ON brand_token(brand_id);
CREATE INDEX idx_brand_token_symbol ON brand_token(symbol);
CREATE INDEX idx_brand_token_nft_token_id ON brand_token(nft_token_id);

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
CREATE INDEX idx_token_holder_user_id ON token_holder(user_id);
CREATE INDEX idx_token_holder_token_id ON token_holder(token_id);
CREATE INDEX idx_token_holder_balance ON token_holder(balance DESC);

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
CREATE INDEX idx_token_transaction_token_id ON token_transaction(token_id, created_at DESC);
CREATE INDEX idx_token_transaction_from_user_id ON token_transaction(from_user_id);
CREATE INDEX idx_token_transaction_to_user_id ON token_transaction(to_user_id);
CREATE INDEX idx_token_transaction_type ON token_transaction(transaction_type);

CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
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
CREATE INDEX idx_event_brand_id ON event(brand_id);
CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_starts_at ON event(starts_at);
CREATE INDEX idx_event_nft_collection_contract ON event(nft_collection_contract_address);

CREATE TABLE IF NOT EXISTS event_nft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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
  UNIQUE (event_id, nft_token_id)
);
CREATE INDEX idx_event_nft_event_id ON event_nft(event_id);
CREATE INDEX idx_event_nft_user_id ON event_nft(user_id);
CREATE INDEX idx_event_nft_status ON event_nft(status);
CREATE INDEX idx_event_nft_created_at ON event_nft(created_at DESC);
CREATE INDEX idx_event_nft_token_id ON event_nft(event_id, nft_token_id);

CREATE TABLE IF NOT EXISTS brand_application (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_email TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_phone TEXT,
  brand_name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  business_registration_number TEXT NOT NULL,
  country TEXT NOT NULL,
  headquarters_street TEXT NOT NULL,
  headquarters_city TEXT NOT NULL,
  headquarters_zip_code TEXT NOT NULL,
  headquarters_address_complement TEXT,
  motivation TEXT,
  estimated_community_size INTEGER,
  social_media_links JSONB,
  how_did_you_hear_about_us TEXT,
  registration_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_brand_application_status CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  CONSTRAINT chk_brand_application_community_size_positive CHECK (estimated_community_size IS NULL OR estimated_community_size >= 0)
);
CREATE INDEX idx_brand_application_status ON brand_application(status);
CREATE INDEX idx_brand_application_contact_email ON brand_application(contact_email);
CREATE INDEX idx_brand_application_brand_name ON brand_application(brand_name);
CREATE INDEX idx_brand_application_created_at ON brand_application(created_at DESC);
CREATE INDEX idx_brand_application_reviewed_by ON brand_application(reviewed_by);
CREATE INDEX idx_brand_application_email_verification_token ON brand_application(email_verification_token);

CREATE TABLE IF NOT EXISTS brand_like (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);
CREATE INDEX idx_brand_like_user_id ON brand_like(user_id);
CREATE INDEX idx_brand_like_brand_id ON brand_like(brand_id);
CREATE INDEX idx_brand_like_created_at ON brand_like(created_at DESC);

CREATE TABLE IF NOT EXISTS brand_application_interest (
  brand_application_id UUID NOT NULL REFERENCES brand_application(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_application_id, interest_id)
);
CREATE INDEX idx_brand_application_interest_app_id ON brand_application_interest(brand_application_id);
CREATE INDEX idx_brand_application_interest_interest_id ON brand_application_interest(interest_id);

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
    'password_changed',
    'brand_application_notification',
    'brand_application_approved',
    'brand_application_rejected'
  ))
);
CREATE INDEX idx_email_template_type ON email_template(template_type);

CREATE TABLE IF NOT EXISTS user_ban (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_user_ban_expires_at CHECK (
    is_permanent = TRUE OR expires_at IS NULL OR expires_at > banned_at
  )
);
CREATE INDEX idx_user_ban_user_id ON user_ban(user_id);
CREATE INDEX idx_user_ban_banned_by ON user_ban(banned_by);
CREATE INDEX idx_user_ban_banned_at ON user_ban(banned_at DESC);
CREATE INDEX idx_user_ban_expires_at ON user_ban(expires_at);
CREATE INDEX idx_user_ban_is_permanent ON user_ban(is_permanent);
CREATE INDEX idx_user_ban_active ON user_ban(user_id, expires_at) WHERE is_permanent = FALSE;

CREATE TABLE IF NOT EXISTS brand_ban (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_brand_ban_expires_at CHECK (
    is_permanent = TRUE OR expires_at IS NULL OR expires_at > banned_at
  )
);
CREATE INDEX idx_brand_ban_brand_id ON brand_ban(brand_id);
CREATE INDEX idx_brand_ban_banned_by ON brand_ban(banned_by);
CREATE INDEX idx_brand_ban_banned_at ON brand_ban(banned_at DESC);
CREATE INDEX idx_brand_ban_expires_at ON brand_ban(expires_at);
CREATE INDEX idx_brand_ban_is_permanent ON brand_ban(is_permanent);
CREATE INDEX idx_brand_ban_active ON brand_ban(brand_id, expires_at) WHERE is_permanent = FALSE;

CREATE OR REPLACE FUNCTION validate_ban_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "user" WHERE id = NEW.banned_by AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Only ADMIN users can issue bans';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS brand_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ipfs_hash TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_brand_media_brand_id ON brand_media(brand_id);
CREATE INDEX idx_brand_media_display_order ON brand_media(display_order);

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_updated_at BEFORE UPDATE ON brand FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_token_updated_at BEFORE UPDATE ON brand_token FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_token_holder_updated_at BEFORE UPDATE ON token_holder FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON event FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_nft_updated_at BEFORE UPDATE ON event_nft FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_application_updated_at BEFORE UPDATE ON brand_application FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_template_updated_at BEFORE UPDATE ON email_template FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ban_updated_at BEFORE UPDATE ON user_ban FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_ban_updated_at BEFORE UPDATE ON brand_ban FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_brand_media_updated_at BEFORE UPDATE ON brand_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER validate_user_ban_admin BEFORE INSERT OR UPDATE ON user_ban FOR EACH ROW EXECUTE FUNCTION validate_ban_admin();
CREATE TRIGGER validate_brand_ban_admin BEFORE INSERT OR UPDATE ON brand_ban FOR EACH ROW EXECUTE FUNCTION validate_ban_admin();

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
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS brand_media CASCADE;
DROP TABLE IF EXISTS brand_ban CASCADE;
DROP TABLE IF EXISTS user_ban CASCADE;
DROP TABLE IF EXISTS email_template CASCADE;
DROP TABLE IF EXISTS brand_application_interest CASCADE;
DROP TABLE IF EXISTS brand_like CASCADE;
DROP TABLE IF EXISTS brand_application CASCADE;
DROP TABLE IF EXISTS event_nft CASCADE;
DROP TABLE IF EXISTS event CASCADE;
DROP TABLE IF EXISTS token_transaction CASCADE;
DROP TABLE IF EXISTS token_holder CASCADE;
DROP TABLE IF EXISTS brand_token CASCADE;
DROP TABLE IF EXISTS brand_interest CASCADE;
DROP TABLE IF EXISTS user_interest CASCADE;
DROP TABLE IF EXISTS interest CASCADE;
DROP TABLE IF EXISTS brand CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP FUNCTION IF EXISTS validate_ban_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
`);
  }
}
