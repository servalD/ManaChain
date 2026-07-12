import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Miroir SQL de la chaîne : curseur de synchronisation, registre des modules de
 * marque déployés (BrandFactory), et des ventes de token (SaleFactory). Étend
 * `token_transaction` pour tracer les mouvements ERC-20 lus on-chain (achats,
 * refunds, transferts P2P) au lieu des écritures applicatives directes.
 */
export class ChainSync1750000000002 implements MigrationInterface {
  name = 'ChainSync1750000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS chain_sync_cursor (
  id TEXT PRIMARY KEY,
  last_processed_block BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID UNIQUE REFERENCES brand(id) ON DELETE SET NULL,
  brand_address TEXT NOT NULL UNIQUE,
  genesis_nft_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  support_token_address TEXT NOT NULL,
  whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
  blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  deploy_tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_brand_contracts_brand_address ON brand_contracts(brand_address);
CREATE INDEX idx_brand_contracts_brand_id ON brand_contracts(brand_id);

CREATE TABLE IF NOT EXISTS token_sale (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL UNIQUE REFERENCES brand_token(id) ON DELETE CASCADE,
  escrow_address TEXT NOT NULL UNIQUE,
  price_per_token NUMERIC(78, 0) NOT NULL,
  total_for_sale NUMERIC(78, 0) NOT NULL,
  sold_amount NUMERIC(78, 0) NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  deploy_tx_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_token_sale_status CHECK (status IN ('open', 'closed', 'cancelled_by_brand', 'cancelled_by_admin'))
);
CREATE INDEX idx_token_sale_escrow_address ON token_sale(escrow_address);

ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS log_index INTEGER;
ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS block_number BIGINT;
ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS from_address TEXT;
ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS to_address TEXT;

-- to_user_id devient nullable : un transfert ERC-20 peut cibler une adresse
-- qui n'est pas (encore) liée à un compte ManaChain.
ALTER TABLE token_transaction ALTER COLUMN to_user_id DROP NOT NULL;

ALTER TABLE token_transaction DROP CONSTRAINT IF EXISTS chk_transaction_type;
ALTER TABLE token_transaction ADD CONSTRAINT chk_transaction_type
  CHECK (transaction_type IN ('purchase', 'transfer', 'reward', 'initial_emission', 'refund'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_transaction_tx_hash_log_index
  ON token_transaction(tx_hash, log_index) WHERE tx_hash IS NOT NULL;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP INDEX IF EXISTS idx_token_transaction_tx_hash_log_index;
ALTER TABLE token_transaction DROP CONSTRAINT IF EXISTS chk_transaction_type;
ALTER TABLE token_transaction ADD CONSTRAINT chk_transaction_type
  CHECK (transaction_type IN ('purchase', 'transfer', 'reward', 'initial_emission'));
ALTER TABLE token_transaction ALTER COLUMN to_user_id SET NOT NULL;
ALTER TABLE token_transaction DROP COLUMN IF EXISTS to_address;
ALTER TABLE token_transaction DROP COLUMN IF EXISTS from_address;
ALTER TABLE token_transaction DROP COLUMN IF EXISTS block_number;
ALTER TABLE token_transaction DROP COLUMN IF EXISTS log_index;
ALTER TABLE token_transaction DROP COLUMN IF EXISTS tx_hash;
DROP TABLE IF EXISTS token_sale CASCADE;
DROP TABLE IF EXISTS brand_contracts CASCADE;
DROP TABLE IF EXISTS chain_sync_cursor CASCADE;
`);
  }
}
