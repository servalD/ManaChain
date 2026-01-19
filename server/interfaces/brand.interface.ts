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

// Brand Application Interfaces
export interface CreateBrandApplicationRequest {
  // Contact Information
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone?: string;
  
  // Brand Information
  brand_name: string;
  industry_type: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  
  // Legal Information
  business_registration_number: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement?: string;
  registration_proof_url?: string;
  
  // Additional Information
  motivation?: string;
  estimated_community_size?: number;
  social_media_links?: Record<string, string>;
  how_did_you_hear_about_us?: string;
}

export interface GetBrandApplicationsFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'needs_review';
  search?: string;
}

export interface GetBrandApplicationsRequest {
  limit: number;
  offset: number;
  filters?: GetBrandApplicationsFilters;
}

export interface ApproveBrandApplicationRequest {
  applicationId: string;
  adminUserId: string;
}

export interface RejectBrandApplicationRequest {
  applicationId: string;
  adminUserId: string;
  rejection_reason: string;
}
