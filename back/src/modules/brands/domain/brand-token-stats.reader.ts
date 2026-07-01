export interface BrandTokenStats {
  tokenHolders: number;
  totalRaised: string;
  tokenSymbol: string | null;
  tokenPrice: string | null;
}

/**
 * PORT de lecture seule des statistiques token d'une marque (tables
 * `brand_token` / `token_holder` / `token_transaction`). Garde le module `brands`
 * découplé du module `tokens` : c'est le même pattern que `BrandDirectory`
 * (likes) / `BrandLookup` (tokens), en sens `brands → tokens`. Renvoie des zéros
 * si la marque n'a pas encore de token.
 */
export abstract class BrandTokenStatsReader {
  abstract getStatsByBrand(brandId: string): Promise<BrandTokenStats>;
}
