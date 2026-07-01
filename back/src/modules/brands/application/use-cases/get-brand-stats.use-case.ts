import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';
import {
  BrandTokenStats,
  BrandTokenStatsReader,
} from '../../domain/brand-token-stats.reader';

export type BrandStats = BrandTokenStats;

/**
 * Statistiques d'une marque (token, détenteurs, montant levé). Vérifie l'existence
 * de la marque puis délègue la lecture des tables `tokens` au
 * {@link BrandTokenStatsReader} (module `brands` découplé du module `tokens`).
 */
@Injectable()
export class GetBrandStatsUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly statsReader: BrandTokenStatsReader,
  ) {}

  async execute(brandId: string): Promise<BrandStats> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return this.statsReader.getStatsByBrand(brandId);
  }
}
