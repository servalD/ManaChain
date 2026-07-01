import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../brands/domain/brand.repository';
import { BrandDirectory } from '../domain/brand-directory';

/**
 * Adapter {@link BrandDirectory} : délègue au {@link BrandRepository} du module
 * `brands` (exporté par `BrandsModule`). Remplace l'ancien accès SQL direct à la
 * table `brand`.
 */
@Injectable()
export class TypeOrmBrandDirectory extends BrandDirectory {
  constructor(private readonly brandRepository: BrandRepository) {
    super();
  }

  async exists(brandId: string): Promise<boolean> {
    return (await this.brandRepository.findOwnerId(brandId)) !== null;
  }

  findOwnerId(brandId: string): Promise<string | null> {
    return this.brandRepository.findOwnerId(brandId);
  }
}
