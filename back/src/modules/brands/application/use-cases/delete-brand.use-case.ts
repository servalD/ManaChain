import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { BrandRepository } from '../../domain/brand.repository';
import {
  BrandNotFoundError,
  NotBrandOwnerError,
} from '../../domain/brand.errors';

/**
 * Supprime une marque dont l'utilisateur est propriétaire (cascade DB sur token,
 * médias, likes…). Repasse `is_brand=false` sur le compte.
 */
@Injectable()
export class DeleteBrandUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, brandId: string): Promise<void> {
    const ownerId = await this.brandRepository.findOwnerId(brandId);
    if (ownerId === null) {
      throw new BrandNotFoundError();
    }
    if (ownerId !== userId) {
      throw new NotBrandOwnerError();
    }
    await this.brandRepository.delete(brandId);
    await this.userRepository.setBrandFlag(userId, false);
  }
}
