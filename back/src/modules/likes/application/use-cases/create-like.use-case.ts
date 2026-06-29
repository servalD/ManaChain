import { Injectable } from '@nestjs/common';
import { Like } from '../../domain/like';
import { LikeRepository } from '../../domain/like.repository';
import { BrandDirectory } from '../../domain/brand-directory';
import {
  AlreadyLikedError,
  BrandNotFoundError,
} from '../../domain/like.errors';

/**
 * Aime une marque : vérifie l'existence de la marque et l'unicité du like.
 */
@Injectable()
export class CreateLikeUseCase {
  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly brandDirectory: BrandDirectory,
  ) {}

  async execute(userId: string, brandId: string): Promise<Like> {
    if (!(await this.brandDirectory.exists(brandId))) {
      throw new BrandNotFoundError(brandId);
    }
    if (await this.likeRepository.existsByUserAndBrand(userId, brandId)) {
      throw new AlreadyLikedError();
    }
    return this.likeRepository.create(userId, brandId);
  }
}
