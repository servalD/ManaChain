import { BrandDirectory } from '../domain/brand-directory';

/**
 * Fake {@link BrandDirectory} pour les tests : map brandId → ownerId préchargée.
 */
export class InMemoryBrandDirectory extends BrandDirectory {
  private readonly owners = new Map<string, string>();

  seedBrand(brandId: string, ownerId: string): void {
    this.owners.set(brandId, ownerId);
  }

  exists(brandId: string): Promise<boolean> {
    return Promise.resolve(this.owners.has(brandId));
  }

  findOwnerId(brandId: string): Promise<string | null> {
    return Promise.resolve(this.owners.get(brandId) ?? null);
  }
}
