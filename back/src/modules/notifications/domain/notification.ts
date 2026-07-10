export type NotificationType =
  | 'admin_message'
  | 'brand_whitelisted'
  | 'brand_banned'
  | 'token_purchased'
  | 'ticket_purchased'
  | 'sale_cancelled_by_brand';

/** Modèle de domaine PUR — aucun import framework / ORM ici. */
export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly readAt: Date | null,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
  ) {}
}
