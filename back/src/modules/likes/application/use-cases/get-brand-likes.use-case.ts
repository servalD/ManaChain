import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { LikeRepository } from '../../domain/like.repository';
import { BrandDirectory } from '../../domain/brand-directory';
import { Liker } from '../../domain/like.views';
import {
  BrandNotFoundError,
  NotBrandOwnerError,
} from '../../domain/like.errors';

/**
 * Liste les utilisateurs ayant aimé une marque. Réservé au **propriétaire de la
 * marque** ou à un **admin** (autorisation dynamique → portée par le use-case,
 * pas par `@Roles`).
 */
@Injectable()
export class GetBrandLikesUseCase {
  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly brandDirectory: BrandDirectory,
  ) {}

  async execute(requester: User, brandId: string): Promise<Liker[]> {
    const ownerId = await this.brandDirectory.findOwnerId(brandId);
    if (ownerId === null) {
      throw new BrandNotFoundError(brandId);
    }
    if (ownerId !== requester.id && !requester.isAdmin()) {
      throw new NotBrandOwnerError();
    }
    return this.likeRepository.findLikersByBrand(brandId);
  }
}
