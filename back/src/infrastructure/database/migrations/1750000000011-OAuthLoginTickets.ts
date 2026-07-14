import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ticket d'échange à usage unique pour le callback Google OAuth (au lieu de
 * transmettre le JWT + refresh token en clair dans l'URL de redirection).
 * `ticket_hash` stocke un SHA-256 du jeton opaque — jamais le jeton en clair,
 * même précaution que `refresh_token`. `used_at` marque la consommation
 * (single-use) ; `redeem` fait l'UPDATE ... RETURNING atomique.
 */
export class OAuthLoginTickets1750000000011 implements MigrationInterface {
  name = 'OAuthLoginTickets1750000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS oauth_login_ticket (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_oauth_login_ticket_user_id ON oauth_login_ticket(user_id);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS oauth_login_ticket;
`);
  }
}
