import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backlog sécu : 2FA TOTP (authenticator app). `two_factor_secret` est
 * chiffré côté application (AES-256-GCM, cf. `AesTwoFactorSecretCipher`) —
 * jamais stocké en clair. `user_two_factor_challenge` est un jeton opaque
 * server-side distinct du JWT applicatif (cf. `TwoFactorChallengeRepository`) :
 * s'il s'agissait d'un JWT signé, `AuthenticateBearerUseCase` l'accepterait
 * comme jeton de session complet et court-circuiterait le 2FA.
 */
export class TwoFactorAuth1750000000007 implements MigrationInterface {
  name = 'TwoFactorAuth1750000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE "user" ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN two_factor_secret TEXT;

CREATE TABLE IF NOT EXISTS user_two_factor_recovery_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_2fa_recovery_user_id ON user_two_factor_recovery_code(user_id);

CREATE TABLE IF NOT EXISTS user_two_factor_challenge (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_2fa_challenge_expires_at ON user_two_factor_challenge(expires_at);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS user_two_factor_challenge;
DROP TABLE IF EXISTS user_two_factor_recovery_code;
ALTER TABLE "user" DROP COLUMN two_factor_secret;
ALTER TABLE "user" DROP COLUMN two_factor_enabled;
`);
  }
}
