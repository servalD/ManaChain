import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';

/** Récupère la marque d'un utilisateur (par owner id). Sert aussi à `/brands/me`. */
@Injectable()
export class GetBrandByUserUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async execute(userId: string): Promise<Brand> {
    const brand = await this.brandRepository.findByOwnerId(userId);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return brand;
  }
}
