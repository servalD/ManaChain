import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute `price_per_token` à `token_transaction`. La colonne n'existait pas dans
 * `init.sql` (le calcul `totalRaised` de l'Express, qui la lisait, était donc
 * mort) : on la crée pour enregistrer le prix unitaire au moment de l'achat et
 * calculer les statistiques marque `Σ(amount × price_per_token)`.
 *
 * Nullable : seuls les `purchase` portent un prix ; transferts/récompenses/
 * émissions restent à NULL, et les lignes historiques éventuelles aussi.
 */
export class AddPricePerTokenToTokenTransaction1750000000001 implements MigrationInterface {
  name = 'AddPricePerTokenToTokenTransaction1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE token_transaction ADD COLUMN IF NOT EXISTS price_per_token DECIMAL(20, 8)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE token_transaction DROP COLUMN IF EXISTS price_per_token`,
    );
  }
}
