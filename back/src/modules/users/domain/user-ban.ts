/** Modèle de domaine PUR (table `user_ban`) — aucun import framework / ORM ici. */
export class UserBan {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly reason: string,
    public readonly bannedBy: string,
    public readonly bannedAt: Date,
    public readonly expiresAt: Date | null,
    public readonly isPermanent: boolean,
    public readonly notes: string | null,
  ) {}

  isActive(now: Date = new Date()): boolean {
    return (
      this.isPermanent || (this.expiresAt !== null && this.expiresAt > now)
    );
  }
}
