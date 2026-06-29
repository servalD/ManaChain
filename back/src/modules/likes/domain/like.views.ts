/**
 * Read-models renvoyés par les requêtes jointes du {@link LikeRepository}.
 * Indépendants des modules `brands`/`users` (pas encore migrés) : on n'expose
 * qu'un sous-ensemble utile, sans secret.
 */

/** Résumé d'une marque aimée (sous-ensemble de la table `brand`). */
export interface BrandSummary {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  country: string;
  createdAt: Date;
}

/** Une marque aimée par l'utilisateur courant (GET /likes/me). */
export interface LikedBrand {
  likeId: string;
  likedAt: Date;
  brand: BrandSummary;
}

/** Profil public d'un utilisateur ayant aimé une marque (sans secret). */
export interface LikerUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  ageRange: string;
  verified: boolean;
}

/** Un utilisateur ayant aimé une marque (GET /likes/brand/:id). */
export interface Liker {
  likeId: string;
  likedAt: Date;
  user: LikerUser;
}
