import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backlog sécu : refresh tokens révocables (H-3 de SECURITY_AUDIT.md).
 * `token_hash` stocke un SHA-256 du jeton opaque — jamais le jeton en clair,
 * même schéma de précaution que `user_two_factor_challenge`. La rotation
 * (un refresh consomme l'ancien jeton et en émet un nouveau) permet de
 * détecter un vol : la réutilisation d'un jeton déjà révoqué révoque toute
 * la session (cf. `RefreshSessionUseCase`).
 */
export class RefreshTokens1750000000008 implements MigrationInterface {
  name = 'RefreshTokens1750000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS refresh_token (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_token_user_id ON refresh_token(user_id);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS refresh_token;
`);
  }
}
