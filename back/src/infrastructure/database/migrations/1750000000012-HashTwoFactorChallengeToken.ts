import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `user_two_factor_challenge.token` était stocké en clair (seule table de
 * jeton opaque à ne pas suivre la convention hash SHA-256 de `refresh_token`/
 * `oauth_login_ticket`). Les lignes existantes sont éphémères (TTL 5 min) —
 * on les purge plutôt que de les migrer, un challenge en cours forcera
 * simplement une nouvelle tentative de connexion.
 */
export class HashTwoFactorChallengeToken1750000000012
  implements MigrationInterface
{
  name = 'HashTwoFactorChallengeToken1750000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM user_two_factor_challenge;
ALTER TABLE user_two_factor_challenge RENAME COLUMN token TO token_hash;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM user_two_factor_challenge;
ALTER TABLE user_two_factor_challenge RENAME COLUMN token_hash TO token;
`);
  }
}
