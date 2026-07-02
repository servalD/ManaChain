/**
 * Brand Types
 * TypeScript interfaces for brand-related data
 */

export interface InterestRef {
  id: string;
  label: string;
}

export interface BrandFromAPI {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  businessRegistrationNumber: string | null;
  country: string;
  headquartersStreet: string;
  headquartersCity: string;
  headquartersZipCode: string;
  headquartersAddressComplement: string | null;
  socialMedias: Record<string, string> | null;
  interests: InterestRef[];
  createdAt: string;
}

export interface GetBrandsResponse {
  brands: BrandFromAPI[];
  total: number;
}

export interface BrandStats {
  tokenHolders: number;
  totalRaised: string;
  tokenSymbol: string | null;
  tokenPrice: string | null;
}
