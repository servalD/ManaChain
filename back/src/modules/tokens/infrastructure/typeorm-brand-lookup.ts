import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../brands/domain/brand.repository';
import { BrandLookup } from '../domain/brand-lookup';

/**
 * Adapter {@link BrandLookup} : délègue au {@link BrandRepository} du module
 * `brands` (exporté par `BrandsModule`). Remplace l'ancien accès SQL direct à la
 * table `brand`.
 */
@Injectable()
export class TypeOrmBrandLookup extends BrandLookup {
  constructor(private readonly brandRepository: BrandRepository) {
    super();
  }

  async findBrandIdByOwner(userId: string): Promise<string | null> {
    const brand = await this.brandRepository.findByOwnerId(userId);
    return brand?.id ?? null;
  }

  findOwnerId(brandId: string): Promise<string | null> {
    return this.brandRepository.findOwnerId(brandId);
  }
}
