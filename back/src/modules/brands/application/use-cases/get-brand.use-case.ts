import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';

/** Récupère une marque par son id (public). */
@Injectable()
export class GetBrandUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async execute(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return brand;
  }
}
