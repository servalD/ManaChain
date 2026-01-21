/**
 * Brand Types
 * TypeScript interfaces for brand-related data
 */

export interface BrandFromAPI {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  brand_token?: Array<{
    id: string;
    symbol: string;
    current_price: string;
    total_supply: number;
  }>;
  brand_interest?: Array<{
    interest: {
      id: string;
      label: string;
    };
  }>;
}

export interface GetBrandsResponse {
  brands: BrandFromAPI[];
  total: number;
  limit: number;
  offset: number;
}
