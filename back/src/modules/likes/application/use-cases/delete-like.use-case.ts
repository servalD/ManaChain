import { Injectable } from '@nestjs/common';
import { LikeRepository } from '../../domain/like.repository';
import { LikeNotFoundError, NotLikeOwnerError } from '../../domain/like.errors';

/** Supprime un like — l'utilisateur ne peut retirer que ses propres likes. */
@Injectable()
export class DeleteLikeUseCase {
  constructor(private readonly likeRepository: LikeRepository) {}

  async execute(userId: string, likeId: string): Promise<void> {
    const like = await this.likeRepository.findById(likeId);
    if (!like) {
      throw new LikeNotFoundError(likeId);
    }
    if (like.userId !== userId) {
      throw new NotLikeOwnerError();
    }
    await this.likeRepository.delete(likeId);
  }
}
