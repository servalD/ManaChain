export interface EngagementPoint {
  /** Jour au format ISO (YYYY-MM-DD). */
  date: string;
  /** Détenteurs cumulés du token de la marque à cette date (0 si pas de token). */
  holders: number;
  /** Likes cumulés reçus par la marque à cette date. */
  likes: number;
}

/**
 * PORT de lecture seule de l'historique d'engagement d'une marque (tables
 * `brand_token` / `token_holder` / `brand_like`). Garde le module `brands`
 * découplé des modules `tokens`/`likes` : même pattern que
 * {@link BrandTokenStatsReader}.
 */
export abstract class BrandEngagementHistoryReader {
  abstract getHistory(
    brandId: string,
    days: number,
  ): Promise<EngagementPoint[]>;
}
