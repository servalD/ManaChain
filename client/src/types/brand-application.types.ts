/**
 * Forme interne du formulaire de candidature (wizard). Volontairement en
 * snake_case car c'est l'état local du formulaire, indépendant du contrat
 * API : `BrandApplicationService.createApplication` la traduit en camelCase
 * pour la requête réseau.
 */
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
  registration_proof_upload_id?: string;

  // Additional Information
  motivation?: string;
  estimated_community_size?: number;
  social_media_links?: Record<string, string>;
  how_did_you_hear_about_us?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
