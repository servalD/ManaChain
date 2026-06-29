import { Injectable } from '@nestjs/common';
import { BrandMedia } from '../../domain/brand-media';
import { BrandMediaRepository } from '../../domain/brand-media.repository';
import { BrandRepository } from '../../domain/brand.repository';
import {
  BrandNotFoundError,
  NotBrandOwnerError,
} from '../../domain/brand.errors';

/**
 * Enregistre un média déjà uploadé sur IPFS (Pinata) pour une marque dont
 * l'utilisateur est propriétaire.
 */
@Injectable()
export class ConfirmBrandMediaUseCase {
  constructor(
    private readonly mediaRepository: BrandMediaRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(
    userId: string,
    brandId: string,
    ipfsHash: string,
    imageUrl: string,
  ): Promise<BrandMedia> {
    await this.assertOwnership(userId, brandId);
    return this.mediaRepository.create(brandId, imageUrl, ipfsHash);
  }

  private async assertOwnership(
    userId: string,
    brandId: string,
  ): Promise<void> {
    const ownerId = await this.brandRepository.findOwnerId(brandId);
    if (ownerId === null) {
      throw new BrandNotFoundError();
    }
    if (ownerId !== userId) {
      throw new NotBrandOwnerError();
    }
  }
}
