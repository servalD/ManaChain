import { randomUUID } from 'node:crypto';
import { Like } from '../domain/like';
import { LikeRepository } from '../domain/like.repository';
import { LikedBrand, Liker } from '../domain/like.views';

/**
 * Fake {@link LikeRepository} pour les tests unitaires. Modélise le CRUD ;
 * les lectures jointes ({@link LikedBrand}/{@link Liker}) renvoient ce qui a été
 * préchargé via `seedLikedBrands` / `seedLikers` (les vraies jointures SQL sont
 * couvertes par les tests e2e).
 */
export class InMemoryLikeRepository extends LikeRepository {
  private readonly likes = new Map<string, Like>();
  private likedBrands: LikedBrand[] = [];
  private likers: Liker[] = [];

  seedLike(userId: string, brandId: string): Like {
    const like = new Like(randomUUID(), userId, brandId, new Date());
    this.likes.set(like.id, like);
    return like;
  }

  seedLikedBrands(views: LikedBrand[]): void {
    this.likedBrands = views;
  }

  seedLikers(views: Liker[]): void {
    this.likers = views;
  }

  existsByUserAndBrand(userId: string, brandId: string): Promise<boolean> {
    const found = [...this.likes.values()].some(
      (l) => l.userId === userId && l.brandId === brandId,
    );
    return Promise.resolve(found);
  }

  create(userId: string, brandId: string): Promise<Like> {
    return Promise.resolve(this.seedLike(userId, brandId));
  }

  findById(likeId: string): Promise<Like | null> {
    return Promise.resolve(this.likes.get(likeId) ?? null);
  }

  delete(likeId: string): Promise<void> {
    this.likes.delete(likeId);
    return Promise.resolve();
  }

  findLikedBrandsByUser(): Promise<LikedBrand[]> {
    return Promise.resolve(this.likedBrands);
  }

  findLikersByBrand(): Promise<Liker[]> {
    return Promise.resolve(this.likers);
  }
}
