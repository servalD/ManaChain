import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import {
  BrandRepository,
  ListBrandsParams,
} from '../../domain/brand.repository';
import { BrandBanReader } from '../../domain/brand-ban.reader';

/**
 * Liste paginée des marques (public) avec filtres search / interestId /
 * excludeBrandIds — exclut aussi les marques ayant un ban actif (une marque
 * bannie ne doit pas apparaître dans les suggestions de like/discover).
 */
@Injectable()
export class ListBrandsUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly banReader: BrandBanReader,
  ) {}

  async execute(
    params: ListBrandsParams,
  ): Promise<{ brands: Brand[]; total: number }> {
    const bannedIds = await this.banReader.findActivelyBannedBrandIds();
    const excludeBrandIds = [...(params.excludeBrandIds ?? []), ...bannedIds];
    return this.brandRepository.list({ ...params, excludeBrandIds });
  }
}
