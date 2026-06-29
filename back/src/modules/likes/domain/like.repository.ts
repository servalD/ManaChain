import { Like } from './like';
import { LikedBrand, Liker } from './like.views';

/**
 * Repository PORT pour la table `brand_like`. Les requêtes jointes renvoient des
 * read-models ({@link LikedBrand}/{@link Liker}) plutôt que des entités ORM.
 */
export abstract class LikeRepository {
  abstract existsByUserAndBrand(
    userId: string,
    brandId: string,
  ): Promise<boolean>;
  abstract create(userId: string, brandId: string): Promise<Like>;
  abstract findById(likeId: string): Promise<Like | null>;
  abstract delete(likeId: string): Promise<void>;

  /** Marques aimées par un utilisateur (jointes), triées par date décroissante. */
  abstract findLikedBrandsByUser(userId: string): Promise<LikedBrand[]>;
  /** Utilisateurs ayant aimé une marque (jointes), triés par date décroissante. */
  abstract findLikersByBrand(brandId: string): Promise<Liker[]>;
}
