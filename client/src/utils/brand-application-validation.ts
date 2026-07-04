import { ValidationResult } from "@/types/brand-application.types";

/**
 * Validation utilities for brand application form
 * Provides strict validation for each step
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (international format)
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/.+\..+/;

// Social media platform-specific validation regexes
const SOCIAL_MEDIA_REGEX = {
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(company|in)\/.+/i,
  facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@?.+/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
};

// Postal code validation (flexible, accepts various formats)
const POSTAL_CODE_REGEX = /^[A-Z0-9\s\-]{3,10}$/i;

/**
 * Validate contact information (Step 1)
 */
export function validateContactInfo(data: {
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.contact_email || !data.contact_email.trim()) {
    errors.contact_email = "Email is required";
  } else if (!EMAIL_REGEX.test(data.contact_email)) {
    errors.contact_email = "Please enter a valid email address";
  }

  // First name validation
  if (!data.contact_first_name || !data.contact_first_name.trim()) {
    errors.contact_first_name = "First name is required";
  } else if (data.contact_first_name.trim().length < 2) {
    errors.contact_first_name = "First name must be at least 2 characters";
  }

  // Last name validation
  if (!data.contact_last_name || !data.contact_last_name.trim()) {
    errors.contact_last_name = "Last name is required";
  } else if (data.contact_last_name.trim().length < 2) {
    errors.contact_last_name = "Last name must be at least 2 characters";
  }

  // Phone validation (optional but must be valid if provided)
  if (data.contact_phone && data.contact_phone.trim()) {
    if (!PHONE_REGEX.test(data.contact_phone)) {
      errors.contact_phone = "Please enter a valid phone number";
    } else if (data.contact_phone.replace(/\D/g, '').length < 10) {
      errors.contact_phone = "Phone number must have at least 10 digits";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate brand information (Step 2)
 */
export function validateBrandInfo(data: {
  brand_name: string;
  interest_ids: string[];
  description: string;
  website_url: string;
  logo_url: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Brand name validation
  if (!data.brand_name || !data.brand_name.trim()) {
    errors.brand_name = "Brand name is required";
  } else if (data.brand_name.trim().length < 2) {
    errors.brand_name = "Brand name must be at least 2 characters";
  } else if (data.brand_name.trim().length > 100) {
    errors.brand_name = "Brand name must be less than 100 characters";
  }

  // Interest IDs validation (1-2 required)
  if (!data.interest_ids || !Array.isArray(data.interest_ids)) {
    errors.interest_ids = "Interests must be selected";
  } else if (data.interest_ids.length === 0) {
    errors.interest_ids = "Please select at least 1 interest";
  } else if (data.interest_ids.length > 2) {
    errors.interest_ids = "You can select a maximum of 2 interests";
  }

  // Description validation (optional but limited length)
  if (data.description && data.description.trim().length > 1000) {
    errors.description = "Description must be less than 1000 characters";
  }

  // Website URL validation (optional but must be valid if provided)
  if (data.website_url && data.website_url.trim()) {
    if (!URL_REGEX.test(data.website_url)) {
      errors.website_url = "Please enter a valid URL (must start with http:// or https://)";
    }
  }

  // Logo URL validation (optional)
  // No specific validation needed as it will be uploaded via Pinata

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate legal information (Step 3)
 */
export function validateLegalInfo(data: {
  business_registration_number: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Business registration number validation
  if (!data.business_registration_number || !data.business_registration_number.trim()) {
    errors.business_registration_number = "Business registration number is required";
  } else if (data.business_registration_number.trim().length < 3) {
    errors.business_registration_number = "Registration number must be at least 3 characters";
  }

  // Country validation
  if (!data.country || !data.country.trim()) {
    errors.country = "Country is required";
  }

  // Street validation
  if (!data.headquarters_street || !data.headquarters_street.trim()) {
    errors.headquarters_street = "Street address is required";
  }

  // City validation
  if (!data.headquarters_city || !data.headquarters_city.trim()) {
    errors.headquarters_city = "City is required";
  }

  // ZIP code validation
  if (!data.headquarters_zip_code || !data.headquarters_zip_code.trim()) {
    errors.headquarters_zip_code = "ZIP/Postal code is required";
  } else if (!POSTAL_CODE_REGEX.test(data.headquarters_zip_code)) {
    errors.headquarters_zip_code = "Please enter a valid postal code";
  }

  // Address complement is optional - no validation needed

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate additional information (Step 4)
 */
export function validateAdditionalInfo(data: {
  motivation: string;
  estimated_community_size: string;
  social_media_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  how_did_you_hear_about_us: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Motivation validation (optional but limited length)
  if (data.motivation && data.motivation.trim().length > 500) {
    errors.motivation = "Motivation must be less than 500 characters";
  }

  // Community size validation (optional but must be a valid number if provided)
  if (data.estimated_community_size && data.estimated_community_size.trim()) {
    const size = parseInt(data.estimated_community_size, 10);
    if (isNaN(size) || size < 0) {
      errors.estimated_community_size = "Please enter a valid number";
    } else if (size > 1000000000) {
      errors.estimated_community_size = "Community size seems unrealistic";
    }
  }

  // Social media links validation (optional but must be valid URLs matching the platform)
  if (data.social_media_links) {
    // Twitter/X validation
    if (data.social_media_links.twitter && data.social_media_links.twitter.trim()) {
      const url = data.social_media_links.twitter.trim();
      if (!URL_REGEX.test(url)) {
        errors.twitter = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.twitter.test(url)) {
        errors.twitter = "Please enter a valid Twitter/X URL (e.g., https://twitter.com/yourbrand or https://x.com/yourbrand)";
      }
    }
    
    // Instagram validation
    if (data.social_media_links.instagram && data.social_media_links.instagram.trim()) {
      const url = data.social_media_links.instagram.trim();
      if (!URL_REGEX.test(url)) {
        errors.instagram = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.instagram.test(url)) {
        errors.instagram = "Please enter a valid Instagram URL (e.g., https://instagram.com/yourbrand)";
      }
    }
    
    // LinkedIn validation
    if (data.social_media_links.linkedin && data.social_media_links.linkedin.trim()) {
      const url = data.social_media_links.linkedin.trim();
      if (!URL_REGEX.test(url)) {
        errors.linkedin = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.linkedin.test(url)) {
        errors.linkedin = "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/company/yourbrand or https://linkedin.com/in/yourname)";
      }
    }
    
    // Facebook validation
    if (data.social_media_links.facebook && data.social_media_links.facebook.trim()) {
      const url = data.social_media_links.facebook.trim();
      if (!URL_REGEX.test(url)) {
        errors.facebook = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.facebook.test(url)) {
        errors.facebook = "Please enter a valid Facebook URL (e.g., https://facebook.com/yourbrand)";
      }
    }
    
    // TikTok validation
    if (data.social_media_links.tiktok && data.social_media_links.tiktok.trim()) {
      const url = data.social_media_links.tiktok.trim();
      if (!URL_REGEX.test(url)) {
        errors.tiktok = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.tiktok.test(url)) {
        errors.tiktok = "Please enter a valid TikTok URL (e.g., https://tiktok.com/@yourbrand)";
      }
    }
    
    // YouTube validation
    if (data.social_media_links.youtube && data.social_media_links.youtube.trim()) {
      const url = data.social_media_links.youtube.trim();
      if (!URL_REGEX.test(url)) {
        errors.youtube = "Please enter a valid URL";
      } else if (!SOCIAL_MEDIA_REGEX.youtube.test(url)) {
        errors.youtube = "Please enter a valid YouTube URL (e.g., https://youtube.com/@yourbrand or https://youtube.com/channel/...)";
      }
    }
  }

  // "How did you hear about us" is optional - no validation needed

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate documents (Step 5)
 */
export function validateDocuments(data: {
  registration_proof_url: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Registration proof is now OPTIONAL
  // No validation needed unless we want to validate the URL format if provided
  
  if (data.registration_proof_url && data.registration_proof_url.trim()) {
    // If provided, it should be either a valid URL or an IPFS URL
    const isValidUrl = URL_REGEX.test(data.registration_proof_url);
    const isIpfsUrl = data.registration_proof_url.includes('/ipfs/');
    
    if (!isValidUrl && !isIpfsUrl) {
      errors.registration_proof_url = "Please provide a valid document URL";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

type AllStepsData = Parameters<typeof validateContactInfo>[0] &
  Parameters<typeof validateBrandInfo>[0] &
  Parameters<typeof validateLegalInfo>[0] &
  Parameters<typeof validateAdditionalInfo>[0] &
  Parameters<typeof validateDocuments>[0];

/**
 * Validate all steps at once (for final submission)
 */
export function validateAllSteps(data: AllStepsData): ValidationResult {
  const step1 = validateContactInfo({
    contact_email: data.contact_email,
    contact_first_name: data.contact_first_name,
    contact_last_name: data.contact_last_name,
    contact_phone: data.contact_phone,
  });

  const step2 = validateBrandInfo({
    brand_name: data.brand_name,
    interest_ids: data.interest_ids,
    description: data.description,
    website_url: data.website_url,
    logo_url: data.logo_url,
  });

  const step3 = validateLegalInfo({
    business_registration_number: data.business_registration_number,
    country: data.country,
    headquarters_street: data.headquarters_street,
    headquarters_city: data.headquarters_city,
    headquarters_zip_code: data.headquarters_zip_code,
    headquarters_address_complement: data.headquarters_address_complement,
  });

  const step4 = validateAdditionalInfo({
    motivation: data.motivation,
    estimated_community_size: data.estimated_community_size,
    social_media_links: data.social_media_links,
    how_did_you_hear_about_us: data.how_did_you_hear_about_us,
  });

  const step5 = validateDocuments({
    registration_proof_url: data.registration_proof_url,
  });

  const allErrors = {
    ...step1.errors,
    ...step2.errors,
    ...step3.errors,
    ...step4.errors,
    ...step5.errors,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
}
