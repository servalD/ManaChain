export interface BrandApplication {
  id: string;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string | null;
  brand_name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  business_registration_number: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement: string | null;
  motivation: string | null;
  estimated_community_size: number | null;
  social_media_links: Record<string, string> | null;
  how_did_you_hear_about_us: string | null;
  registration_proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandApplicationData {
  // Contact Information
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone?: string;
  
  // Brand Information
  brand_name: string;
  interest_ids: string[]; // 1-2 interests required
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

export interface GetBrandApplicationsParams {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'needs_review';
  search?: string;
}

export interface GetBrandApplicationsResponse {
  applications: BrandApplication[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApproveBrandApplicationResponse {
  message: string;
  userId: string;
  brandId: string;
}

export interface RejectBrandApplicationData {
  rejection_reason: string;
}

export interface RejectBrandApplicationResponse {
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FileMetadata {
  ipfsHash: string;
  url: string;
  uploadedAt: string;
}
