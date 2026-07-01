/**
 * PORT de lecture seule des bans de marques (table `brand_ban`). Un ban est
 * « actif » s'il est permanent ou si sa date d'expiration est dans le futur.
 * Permet à la liste admin des marques actives d'exclure les marques bannies sans
 * introduire de module `bans` dédié.
 */
export abstract class BrandBanReader {
  abstract findActivelyBannedBrandIds(): Promise<string[]>;
}
