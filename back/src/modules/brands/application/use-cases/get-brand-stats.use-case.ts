import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';

export interface BrandStats {
  tokenHolders: number;
  totalRaised: string;
  tokenSymbol: string | null;
  tokenPrice: string | null;
}

/**
 * Statistiques d'une marque. **Stub jalon brands** : les vraies valeurs
 * dépendent du module `tokens` (brand_token / token_holder / token_transaction)
 * non encore migré → renvoie des zéros une fois la marque confirmée existante.
 * À rebrancher au jalon `tokens`.
 */
@Injectable()
export class GetBrandStatsUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async execute(brandId: string): Promise<BrandStats> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return {
      tokenHolders: 0,
      totalRaised: '0',
      tokenSymbol: null,
      tokenPrice: null,
    };
  }
}
