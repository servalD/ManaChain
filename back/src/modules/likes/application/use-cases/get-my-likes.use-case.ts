import { Injectable } from '@nestjs/common';
import { LikeRepository } from '../../domain/like.repository';
import { LikedBrand } from '../../domain/like.views';

/** Marques aimées par l'utilisateur courant. */
@Injectable()
export class GetMyLikesUseCase {
  constructor(private readonly likeRepository: LikeRepository) {}

  execute(userId: string): Promise<LikedBrand[]> {
    return this.likeRepository.findLikedBrandsByUser(userId);
  }
}
