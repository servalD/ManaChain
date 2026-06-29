import { Injectable } from '@nestjs/common';
import { BrandMediaRepository } from '../../domain/brand-media.repository';
import { BrandRepository } from '../../domain/brand.repository';
import {
  BrandNotFoundError,
  MediaBrandMismatchError,
  MediaNotFoundError,
  NotBrandOwnerError,
} from '../../domain/brand.errors';

/** Supprime un média d'une marque dont l'utilisateur est propriétaire. */
@Injectable()
export class DeleteBrandMediaUseCase {
  constructor(
    private readonly mediaRepository: BrandMediaRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(
    userId: string,
    brandId: string,
    mediaId: string,
  ): Promise<void> {
    const ownerId = await this.brandRepository.findOwnerId(brandId);
    if (ownerId === null) {
      throw new BrandNotFoundError();
    }
    if (ownerId !== userId) {
      throw new NotBrandOwnerError();
    }

    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new MediaNotFoundError();
    }
    if (media.brandId !== brandId) {
      throw new MediaBrandMismatchError();
    }
    await this.mediaRepository.delete(mediaId);
  }
}
