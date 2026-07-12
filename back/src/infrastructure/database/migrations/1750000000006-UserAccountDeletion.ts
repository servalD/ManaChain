import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backlog RGPD : suppression de compte complète (`DELETE /users/me`), au-delà
 * du délink existant (`UnlinkUserChainDataUseCase`). Approche retenue :
 * anonymisation en place plutôt que suppression physique de la ligne — évite
 * de déclencher les CASCADE (`brand.user_id`) et RESTRICT (`user_ban.banned_by`
 * / `brand_ban.banned_by`) de la baseline, et préserve l'intégrité de
 * l'historique de transactions (`token_transaction`) déjà délinké par
 * `UnlinkUserChainDataUseCase`. `deleted_at` marque le compte comme supprimé ;
 * les lookups (`findById`/`findByEmail`/...) l'excluent, ce qui invalide
 * immédiatement le JWT courant au prochain appel (même mécanisme que le ban).
 */
export class UserAccountDeletion1750000000006 implements MigrationInterface {
  name = 'UserAccountDeletion1750000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE "user" ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_user_deleted_at ON "user"(deleted_at);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP INDEX idx_user_deleted_at;
ALTER TABLE "user" DROP COLUMN deleted_at;
`);
  }
}
