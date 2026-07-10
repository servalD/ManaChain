import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Centre de notifications (simple, en DB, pas de temps réel) : table `notification`
 * alimentée soit par un admin (`POST /notifications`), soit par les handlers
 * chain-sync (ex. marque whitelistée). Ajoute aussi les colonnes de traçabilité
 * on-chain sur `brand_ban` (D8 : bouton Ban → blacklist tx → cancel-sale tx →
 * `POST /brands/:id/ban` avec les hashes) — un brand n'a jamais qu'une seule
 * vente ouverte à la fois (voir `token_sale`), donc un seul hash de cancel suffit.
 */
export class Notifications1750000000004 implements MigrationInterface {
  name = 'Notifications1750000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notification_type CHECK (type IN (
    'admin_message',
    'brand_whitelisted',
    'brand_banned'
  ))
);
CREATE INDEX idx_notification_user_read ON notification(user_id, read_at);
CREATE INDEX idx_notification_created_at ON notification(created_at DESC);

ALTER TABLE brand_ban ADD COLUMN IF NOT EXISTS blacklist_tx_hash TEXT;
ALTER TABLE brand_ban ADD COLUMN IF NOT EXISTS cancel_sale_tx_hash TEXT;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE brand_ban DROP COLUMN IF EXISTS cancel_sale_tx_hash;
ALTER TABLE brand_ban DROP COLUMN IF EXISTS blacklist_tx_hash;
DROP TABLE IF EXISTS notification CASCADE;
`);
  }
}
