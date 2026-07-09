import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module événements : extension de `event` (adresses on-chain), types de
 * billets (`event_ticket_type`), achats (`event_ticket_purchase`, alimentée
 * par chain-sync) et registre de découverte (`event_contracts`, même rôle que
 * `brand_contracts` — rempli par chain-sync avant que le brand ne lie le
 * module déployé à son draft DB via `PATCH /events/:id/contracts`).
 */
export class Events1750000000003 implements MigrationInterface {
  name = 'Events1750000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE event ADD COLUMN IF NOT EXISTS event_tickets_address TEXT;
ALTER TABLE event ADD COLUMN IF NOT EXISTS ticket_sale_address TEXT;
ALTER TABLE event ADD COLUMN IF NOT EXISTS payment_free BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE event ADD COLUMN IF NOT EXISTS deploy_tx_hash TEXT;
ALTER TABLE event ALTER COLUMN ticket_currency SET DEFAULT 'USDC';

CREATE TABLE IF NOT EXISTS event_ticket_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  price NUMERIC(78, 0) NOT NULL DEFAULT 0,
  minted_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, token_id)
);
CREATE INDEX idx_event_ticket_type_event_id ON event_ticket_type(event_id);

CREATE TABLE IF NOT EXISTS event_ticket_purchase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  paid NUMERIC(78, 0) NOT NULL DEFAULT 0,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash, log_index)
);
CREATE INDEX idx_event_ticket_purchase_event_id ON event_ticket_purchase(event_id);
CREATE INDEX idx_event_ticket_purchase_user_id ON event_ticket_purchase(user_id);
CREATE INDEX idx_event_ticket_purchase_buyer_address ON event_ticket_purchase(buyer_address);

CREATE TABLE IF NOT EXISTS event_contracts (
  event_tickets_address TEXT PRIMARY KEY,
  brand_address TEXT NOT NULL,
  ticket_sale_address TEXT,
  deploy_tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_event_contracts_brand_address ON event_contracts(brand_address);

CREATE TRIGGER update_event_ticket_type_updated_at BEFORE UPDATE ON event_ticket_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_contracts_updated_at BEFORE UPDATE ON event_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS event_contracts CASCADE;
DROP TABLE IF EXISTS event_ticket_purchase CASCADE;
DROP TABLE IF EXISTS event_ticket_type CASCADE;
ALTER TABLE event ALTER COLUMN ticket_currency SET DEFAULT 'ETH';
ALTER TABLE event DROP COLUMN IF EXISTS deploy_tx_hash;
ALTER TABLE event DROP COLUMN IF EXISTS payment_free;
ALTER TABLE event DROP COLUMN IF EXISTS ticket_sale_address;
ALTER TABLE event DROP COLUMN IF EXISTS event_tickets_address;
`);
  }
}
