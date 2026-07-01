/**
 * PORT de lecture minimal sur les marques. Évite au module `likes` de connaître
 * la persistance des marques ; l'adapter délègue au `BrandRepository` du module
 * `brands` (exporté par `BrandsModule`).
 */
export abstract class BrandDirectory {
  abstract exists(brandId: string): Promise<boolean>;
  /** Identifiant du propriétaire de la marque (user_id), ou null si absente. */
  abstract findOwnerId(brandId: string): Promise<string | null>;
}
