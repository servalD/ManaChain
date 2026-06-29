import { Brand } from './brand';

export interface CreateBrandParams {
  ownerId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  businessRegistrationNumber?: string | null;
  country: string;
  headquartersStreet: string;
  headquartersCity: string;
  headquartersZipCode: string;
  headquartersAddressComplement?: string | null;
  socialMedias?: Record<string, string> | null;
  interestIds: string[];
}

export interface UpdateBrandFields {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string;
  headquartersStreet?: string;
  headquartersCity?: string;
  headquartersZipCode?: string;
  headquartersAddressComplement?: string | null;
  socialMedias?: Record<string, string> | null;
}

export interface ListBrandsParams {
  limit: number;
  offset: number;
  search?: string;
  interestId?: string;
  excludeBrandIds?: string[];
}

/** Repository PORT de la table `brand` (+ liens `brand_interest`). */
export abstract class BrandRepository {
  abstract existsByOwner(ownerId: string): Promise<boolean>;
  abstract isNameTaken(name: string, exceptBrandId?: string): Promise<boolean>;
  abstract findById(id: string): Promise<Brand | null>;
  abstract findByOwnerId(ownerId: string): Promise<Brand | null>;
  abstract findOwnerId(id: string): Promise<string | null>;
  abstract list(
    params: ListBrandsParams,
  ): Promise<{ brands: Brand[]; total: number }>;
  abstract create(params: CreateBrandParams): Promise<Brand>;
  abstract update(
    id: string,
    fields: UpdateBrandFields,
    interestIds?: string[],
  ): Promise<Brand>;
  abstract delete(id: string): Promise<void>;
}
