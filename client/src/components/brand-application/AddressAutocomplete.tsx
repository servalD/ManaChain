"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import GeocodingService, { AddressSuggestion } from "@/services/geocoding.service";
import { COUNTRY_PHONE_CODES } from "@/utils/constants";

interface AddressAutocompleteProps {
  value: string;
  onChange: (field: string, value: string) => void;
  error?: string;
  selectedCountry?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  error,
  selectedCountry,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync searchQuery with value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery && searchQuery.length >= 3) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        const results = await GeocodingService.searchAddresses(searchQuery);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsLoading(false);
      }, 500);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    // Update the search field with just the street address, not the full display name
    setSearchQuery(suggestion.street || '');
    setIsOpen(false);
    
    // Fill all address fields automatically with proper values
    onChange('headquarters_street', suggestion.street || '');
    onChange('headquarters_city', suggestion.city || '');
    
    onChange('headquarters_zip_code', suggestion.zipCode || '');
    
    // Find matching country in COUNTRY_PHONE_CODES by name or country code
    // This ensures we use the exact country name that matches the select options
    if (suggestion.country || suggestion.countryCode) {
      const matchingCountry = COUNTRY_PHONE_CODES.find(
        c => 
          c.name.toLowerCase() === suggestion.country.toLowerCase() ||
          c.code === suggestion.countryCode
      );
      
      if (matchingCountry) {
        onChange('country', matchingCountry.name);
      } else if (suggestion.country) {
        // Fallback: use the country name from API if no match found
        onChange('country', suggestion.country);
      }
    }
    
    onChange('headquarters_address_complement', '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange('headquarters_street', newValue);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          name="headquarters_street_manual"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
          }`}
          placeholder="Start typing your address..."
          autoComplete="new-password"
          required
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {suggestion.street || 'Address'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.city && suggestion.zipCode 
                      ? `${suggestion.city}, ${suggestion.zipCode}`
                      : suggestion.city || suggestion.zipCode || ''
                    }
                  </p>
                  {suggestion.country && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.country}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
