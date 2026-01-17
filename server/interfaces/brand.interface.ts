export interface CreateBrandRequest {
  userId: string;
  name: string;
  category: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  siret?: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement?: string;
}

export interface UpdateBrandRequest {
  brandId: string;
  userId: string;
  name?: string;
  category?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  siret?: string;
  country?: string;
  headquarters_street?: string;
  headquarters_city?: string;
  headquarters_zip_code?: string;
  headquarters_address_complement?: string;
}

export interface GetBrandsFilters {
  category?: string;
  verified?: boolean;
  search?: string;
}

export interface GetBrandsRequest {
  limit: number;
  offset: number;
  filters?: GetBrandsFilters;
}

export interface DeleteBrandRequest {
  brandId: string;
  userId: string;
}
