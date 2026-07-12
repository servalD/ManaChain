import { BrandBan } from './brand-ban';

export interface CreateBrandBanParams {
  brandId: string;
  reason: string;
  bannedBy: string;
  expiresAt?: Date | null;
  isPermanent: boolean;
  notes?: string | null;
  blacklistTxHash?: string | null;
  cancelSaleTxHash?: string | null;
}

export interface ListBrandBansParams {
  limit: number;
  offset: number;
}

/**
 * Repository PORT (écriture) de la table `brand_ban`. Distinct de
 * {@link BrandBanReader} (lecture seule, utilisé par la liste admin des
 * marques actives) : ce port porte le flux D8 complet (bouton Ban → tx
 * blacklist → tx cancel-sale → audit DB avec les hashes).
 */
export abstract class BrandBanRepository {
  abstract create(params: CreateBrandBanParams): Promise<BrandBan>;
  abstract findActive(brandId: string): Promise<BrandBan | null>;
  /** Lève un ban : le rend non-permanent avec `expires_at = NOW()` (garde l'historique). */
  abstract revoke(brandId: string): Promise<void>;
  abstract list(
    params: ListBrandBansParams,
  ): Promise<{ bans: BrandBan[]; total: number }>;
}
