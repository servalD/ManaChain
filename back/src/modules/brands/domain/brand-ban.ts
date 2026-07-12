/** Modèle de domaine PUR (table `brand_ban`) — aucun import framework / ORM ici. */
export class BrandBan {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly reason: string,
    public readonly bannedBy: string,
    public readonly bannedAt: Date,
    public readonly expiresAt: Date | null,
    public readonly isPermanent: boolean,
    public readonly notes: string | null,
    /** Hash de la tx `manaAdmin.setBrandBlacklisted(brand, true)`, si déjà passée on-chain. */
    public readonly blacklistTxHash: string | null,
    /** Hash de la tx `manaAdmin.cancelTokenSale(escrow)`, si une vente était ouverte. */
    public readonly cancelSaleTxHash: string | null,
  ) {}

  isActive(now: Date = new Date()): boolean {
    return (
      this.isPermanent || (this.expiresAt !== null && this.expiresAt > now)
    );
  }
}
