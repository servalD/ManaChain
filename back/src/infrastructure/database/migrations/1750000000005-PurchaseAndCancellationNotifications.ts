import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Étend `notification.type` (voir `1750000000004-Notifications.ts`) pour les
 * deux cas documentés comme simplification assumée en Phase 5 : achat
 * (token/ticket) et annulation de vente initiée par la marque elle-même
 * (distincte de `cancelled_by_admin`, déjà couverte par `brand_banned`).
 */
export class PurchaseAndCancellationNotifications1750000000005 implements MigrationInterface {
  name = 'PurchaseAndCancellationNotifications1750000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE notification DROP CONSTRAINT chk_notification_type;
ALTER TABLE notification ADD CONSTRAINT chk_notification_type CHECK (type IN (
  'admin_message',
  'brand_whitelisted',
  'brand_banned',
  'token_purchased',
  'ticket_purchased',
  'sale_cancelled_by_brand'
));
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE notification DROP CONSTRAINT chk_notification_type;
ALTER TABLE notification ADD CONSTRAINT chk_notification_type CHECK (type IN (
  'admin_message',
  'brand_whitelisted',
  'brand_banned'
));
`);
  }
}
