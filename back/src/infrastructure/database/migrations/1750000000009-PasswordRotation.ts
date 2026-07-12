import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backlog sécu CNIL : rappel de rotation du mot de passe (60 jours).
 * `password_changed_at` sert de référence pour le calcul de l'échéance
 * (remis à `NOW()` à chaque changement/reset réussi, cf. `updatePassword`) ;
 * `password_reminder_sent_at` évite de renvoyer l'email à chaque exécution du
 * job tant que le mot de passe n'a pas encore 60 jours de plus.
 */
export class PasswordRotation1750000000009 implements MigrationInterface {
  name = 'PasswordRotation1750000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS password_reminder_sent_at TIMESTAMP WITH TIME ZONE;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE "user"
  DROP COLUMN IF EXISTS password_changed_at,
  DROP COLUMN IF EXISTS password_reminder_sent_at;
`);
  }
}
