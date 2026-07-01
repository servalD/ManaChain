/**
 * PORT de lecture minimal sur les marques. Sert à résoudre la marque d'un
 * utilisateur (création de token) et le propriétaire d'une marque (autorisation
 * de mise à jour du prix). L'adapter délègue au `BrandRepository` du module
 * `brands` (exporté par `BrandsModule`).
 */
export abstract class BrandLookup {
  abstract findBrandIdByOwner(userId: string): Promise<string | null>;
  abstract findOwnerId(brandId: string): Promise<string | null>;
}
