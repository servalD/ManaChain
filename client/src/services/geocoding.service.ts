import axios from "axios";
import { ApiService } from "./api.service";

export interface AddressSuggestion {
  displayName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  countryCode: string;
  addressComplement?: string;
  fullAddress: string;
}

export interface GeocodingValidationResult {
  isValid: boolean;
  detectedCountry?: string;
  detectedCountryCode?: string;
}

export default class GeocodingService {
  private static readonly DEBOUNCE_DELAY = 500; // ms
  private static readonly SEARCH_LIMIT = 5;

  /**
   * Search for address suggestions using OpenStreetMap Nominatim
   */
  static async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }

    try {
      const response = await axios.get(
        `${ApiService.NOMINATIM_GEOCODING_URL}/search`,
        {
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            limit: this.SEARCH_LIMIT,
            countrycodes: "", // Search worldwide
          },
          headers: {
            "User-Agent": "ManaChain/1.0", // Required by Nominatim
          },
        }
      );

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map((result: any) => {
        const addr = result.address || {};
        
        // Build street address (house number + road name)
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.pedestrian || addr.path || '';
        let street = '';
        if (houseNumber && road) {
          street = `${houseNumber}, ${road}`;
        } else if (road) {
          street = road;
        } else if (houseNumber) {
          street = houseNumber;
        }

        // City priority: city > town > village > municipality
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        
        // Postal code
        const zipCode = addr.postcode || '';
        
        // Country
        const country = addr.country || '';
        const countryCode = addr.country_code?.toUpperCase() || '';
        
        // Build display name for dropdown (simplified, without region/quarter/suburb)
        // Format: "12, Rue de l'Épée de Bois, Paris, 75005, France"
        const displayParts = [];
        if (street) displayParts.push(street);
        if (city) displayParts.push(city);
        if (zipCode) displayParts.push(zipCode);
        if (country) displayParts.push(country);
        const displayName = displayParts.join(', ');

        return {
          displayName: displayName || result.display_name,
          street: street.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
          country: country.trim(),
          countryCode: countryCode,
          addressComplement: '', // Don't use suburb/neighbourhood/quarter/region
          fullAddress: result.display_name,
        };
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  }

  /**
   * Validate that an address belongs to the selected country
   */
  static async validateAddressCountry(
    street: string,
    city: string,
    zipCode: string,
    selectedCountry: string
  ): Promise<GeocodingValidationResult> {
    try {
      const addressQuery = `${street}, ${city}, ${zipCode}`;
      
      const response = await axios.get(
        `${ApiService.NOMINATIM_GEOCODING_URL}/search`,
        {
          params: {
            q: addressQuery,
            format: "json",
            addressdetails: 1,
            limit: 1,
          },
          headers: {
            "User-Agent": "ManaChain/1.0",
          },
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const countryFromAPI = result.address?.country || "";
        const countryCodeFromAPI = result.address?.country_code?.toUpperCase() || "";

        const { COUNTRY_PHONE_CODES } = await import("@/utils/constants");
        const selectedCountryData = COUNTRY_PHONE_CODES.find(
          c => c.name === selectedCountry
        );

        if (!selectedCountryData) {
          return { isValid: false };
        }

        const isValid = 
          countryFromAPI.toLowerCase() === selectedCountry.toLowerCase() ||
          countryCodeFromAPI === selectedCountryData.code;

        return {
          isValid,
          detectedCountry: countryFromAPI,
          detectedCountryCode: countryCodeFromAPI,
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error("Address validation error:", error);
      return { isValid: true }; // Don't block on error
    }
  }
}
