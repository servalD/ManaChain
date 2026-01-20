/**
 * Service for caching brand application form data in localStorage
 * Allows users to resume their application if they navigate away
 */

const CACHE_KEY = "brand_application_form_cache";
const FILE_METADATA_KEY = "brand_application_file_metadata";

export interface FormData {
  // Contact Information
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  // Brand Information
  brand_name: string;
  industry_type: string;
  description: string;
  website_url: string;
  logo_url: string;
  // Legal Information
  business_registration_number: string;
  country: string;
  headquarters_street: string;
  headquarters_city: string;
  headquarters_zip_code: string;
  headquarters_address_complement: string;
  // Additional Information
  motivation: string;
  estimated_community_size: string;
  social_media_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  how_did_you_hear_about_us: string;
  // Documents
  registration_proof_url: string;
}

export interface FileMetadata {
  [fieldName: string]: {
    ipfsHash: string;
    url: string;
    uploadedAt: string;
  };
}

export default class FormCacheService {
  /**
   * Save form data to localStorage
   * Merges with existing data to preserve all fields
   */
  static saveFormData(data: Partial<FormData>): void {
    try {
      const existing = this.loadFormData() || {};
      const merged = { ...existing, ...data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error("Error saving form data to cache:", error);
    }
  }

  /**
   * Load form data from localStorage
   * Returns null if no cached data exists
   */
  static loadFormData(): Partial<FormData> | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      return JSON.parse(cached);
    } catch (error) {
      console.error("Error loading form data from cache:", error);
      return null;
    }
  }

  /**
   * Clear all form data from cache
   */
  static clearFormData(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(FILE_METADATA_KEY);
    } catch (error) {
      console.error("Error clearing form cache:", error);
    }
  }

  /**
   * Save file metadata (IPFS hash, URL, timestamp)
   * Used to track uploaded files for potential cleanup
   */
  static saveFileMetadata(field: string, ipfsHash: string, url: string): void {
    try {
      const existing = this.loadFileMetadata();
      existing[field] = {
        ipfsHash,
        url,
        uploadedAt: new Date().toISOString(),
      };
      localStorage.setItem(FILE_METADATA_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error("Error saving file metadata:", error);
    }
  }

  /**
   * Load file metadata from localStorage
   */
  static loadFileMetadata(): FileMetadata {
    try {
      const cached = localStorage.getItem(FILE_METADATA_KEY);
      if (!cached) return {};
      
      return JSON.parse(cached);
    } catch (error) {
      console.error("Error loading file metadata:", error);
      return {};
    }
  }

  /**
   * Remove file metadata for a specific field
   */
  static removeFileMetadata(field: string): void {
    try {
      const existing = this.loadFileMetadata();
      delete existing[field];
      localStorage.setItem(FILE_METADATA_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error("Error removing file metadata:", error);
    }
  }

  /**
   * Get IPFS hash for a specific field
   */
  static getFileIpfsHash(field: string): string | null {
    try {
      const metadata = this.loadFileMetadata();
      return metadata[field]?.ipfsHash || null;
    } catch (error) {
      console.error("Error getting file IPFS hash:", error);
      return null;
    }
  }

  /**
   * Check if there is cached form data
   */
  static hasCachedData(): boolean {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return !!cached;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache timestamp (when it was last modified)
   */
  static getCacheTimestamp(): Date | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      // Try to get timestamp from file metadata
      const fileMetadata = this.loadFileMetadata();
      const timestamps = Object.values(fileMetadata).map(f => new Date(f.uploadedAt));
      
      if (timestamps.length > 0) {
        return new Date(Math.max(...timestamps.map(d => d.getTime())));
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}
