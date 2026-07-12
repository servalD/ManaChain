export interface ActivityPoint {
  /** Jour au format ISO (YYYY-MM-DD). */
  date: string;
  /** Likes donnés ce jour-là. */
  likesGiven: number;
  /** Achats de tokens (support) effectués ce jour-là. */
  tokenPurchases: number;
  /** Tickets d'event achetés ce jour-là. */
  eventsAttended: number;
  /**
   * Score de support cumulé à cette date : somme des quantités de tokens
   * achetées depuis le début. Volontairement dimensionless (pas de $) — cf.
   * COMPLIANCE.md, la plateforme évite toute présentation financière/spéculative
   * des tokens de support.
   */
  supportScore: number;
}

/**
 * PORT de lecture seule de l'historique d'activité d'un utilisateur (tables
 * `brand_like` / `token_transaction` / `event_ticket_purchase`). Garde le
 * module `users` découplé des modules `likes`/`tokens`/`chain-sync` : même
 * pattern que `BrandTokenStatsReader` (module `brands`).
 */
export abstract class UserActivityHistoryReader {
  abstract getHistory(userId: string, days: number): Promise<ActivityPoint[]>;
}
