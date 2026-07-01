import { randomUUID } from 'node:crypto';
import { Brand } from '../domain/brand';
import {
  BrandRepository,
  CreateBrandParams,
  ListBrandsParams,
  UpdateBrandFields,
} from '../domain/brand.repository';
import { BrandNotFoundError } from '../domain/brand.errors';

/** Fake {@link BrandRepository} pour les tests unitaires. */
export class InMemoryBrandRepository extends BrandRepository {
  private readonly brands = new Map<string, Brand>();

  existsByOwner(ownerId: string): Promise<boolean> {
    return Promise.resolve(
      [...this.brands.values()].some((b) => b.ownerId === ownerId),
    );
  }

  isNameTaken(name: string, exceptBrandId?: string): Promise<boolean> {
    return Promise.resolve(
      [...this.brands.values()].some(
        (b) => b.name === name && b.id !== exceptBrandId,
      ),
    );
  }

  findById(id: string): Promise<Brand | null> {
    return Promise.resolve(this.brands.get(id) ?? null);
  }

  findByOwnerId(ownerId: string): Promise<Brand | null> {
    return Promise.resolve(
      [...this.brands.values()].find((b) => b.ownerId === ownerId) ?? null,
    );
  }

  findOwnerId(id: string): Promise<string | null> {
    return Promise.resolve(this.brands.get(id)?.ownerId ?? null);
  }

  list(params: ListBrandsParams): Promise<{ brands: Brand[]; total: number }> {
    const excluded = new Set(params.excludeBrandIds ?? []);
    const all = [...this.brands.values()].filter((b) => !excluded.has(b.id));
    return Promise.resolve({
      brands: all.slice(params.offset, params.offset + params.limit),
      total: all.length,
    });
  }

  create(params: CreateBrandParams): Promise<Brand> {
    const now = new Date();
    const brand = new Brand(
      randomUUID(),
      params.ownerId,
      params.name,
      params.description ?? null,
      params.logoUrl ?? null,
      params.websiteUrl ?? null,
      params.businessRegistrationNumber ?? null,
      params.country,
      params.headquartersStreet,
      params.headquartersCity,
      params.headquartersZipCode,
      params.headquartersAddressComplement ?? null,
      params.socialMedias ?? null,
      params.interestIds.map((id) => ({ id, label: id })),
      now,
      now,
    );
    this.brands.set(brand.id, brand);
    return Promise.resolve(brand);
  }

  update(
    id: string,
    fields: UpdateBrandFields,
    interestIds?: string[],
  ): Promise<Brand> {
    const e = this.brands.get(id);
    if (!e) throw new BrandNotFoundError();
    const updated = new Brand(
      e.id,
      e.ownerId,
      fields.name ?? e.name,
      fields.description !== undefined ? fields.description : e.description,
      fields.logoUrl !== undefined ? fields.logoUrl : e.logoUrl,
      fields.websiteUrl !== undefined ? fields.websiteUrl : e.websiteUrl,
      e.businessRegistrationNumber,
      fields.country ?? e.country,
      fields.headquartersStreet ?? e.headquartersStreet,
      fields.headquartersCity ?? e.headquartersCity,
      fields.headquartersZipCode ?? e.headquartersZipCode,
      fields.headquartersAddressComplement !== undefined
        ? fields.headquartersAddressComplement
        : e.headquartersAddressComplement,
      fields.socialMedias !== undefined ? fields.socialMedias : e.socialMedias,
      interestIds
        ? interestIds.map((iid) => ({ id: iid, label: iid }))
        : e.interests,
      e.createdAt,
      new Date(),
    );
    this.brands.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.brands.delete(id);
    return Promise.resolve();
  }
}
