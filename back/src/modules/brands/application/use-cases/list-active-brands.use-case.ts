import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import {
  BrandRepository,
  ListBrandsParams,
} from '../../domain/brand.repository';
import { BrandBanReader } from '../../domain/brand-ban.reader';

/**
 * Liste admin des marques « actives » : comme {@link ListBrandsUseCase}, mais
 * exclut les marques ayant un ban actif (permanent ou non expiré), lus via le
 * {@link BrandBanReader}.
 */
@Injectable()
export class ListActiveBrandsUseCase {
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
