/**
 * PORT de lecture minimal sur les marques, le temps que le module `brands` soit
 * migré. Évite au module `likes` de connaître la persistance des marques.
 * Quand `brands` existera, l'adapter pourra déléguer à son repository.
 */
export abstract class BrandDirectory {
  abstract exists(brandId: string): Promise<boolean>;
  /** Identifiant du propriétaire de la marque (user_id), ou null si absente. */
  abstract findOwnerId(brandId: string): Promise<string | null>;
}
