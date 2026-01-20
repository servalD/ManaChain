"use client";

import { COUNTRY_PHONE_CODES } from "@/utils/constants";
import { AddressAutocomplete } from "./AddressAutocomplete";

interface LegalInformationProps {
  formData: {
    business_registration_number: string;
    country: string;
    headquarters_street: string;
    headquarters_city: string;
    headquarters_zip_code: string;
    headquarters_address_complement: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function LegalInformation({ formData, onChange, errors = {} }: LegalInformationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Legal Information</h2>
        <p className="text-sm text-muted-foreground">
          Provide your business registration and address details
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="business_registration_number" className="block text-sm font-medium text-foreground mb-2">
            Business Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            id="business_registration_number"
            type="text"
            name="business_registration_number_manual"
            value={formData.business_registration_number}
            onChange={(e) => onChange('business_registration_number', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.business_registration_number ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="SIRET, EIN, or equivalent"
            autoComplete="new-password"
            required
          />
          {errors.business_registration_number ? (
            <p className="mt-1 text-xs text-red-500">{errors.business_registration_number}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Enter your SIRET (France), EIN (USA), or equivalent business number
            </p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => onChange('country', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 ${
              errors.country ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            required
          >
            <option value="">Select a country</option>
            {COUNTRY_PHONE_CODES.map((country) => (
              <option key={country.code} value={country.name}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-xs text-red-500">{errors.country}</p>
          )}
        </div>

        <div>
          <label htmlFor="headquarters_street" className="block text-sm font-medium text-foreground mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <AddressAutocomplete
            value={formData.headquarters_street}
            onChange={onChange}
            error={errors.headquarters_street}
            selectedCountry={formData.country}
          />
          {!errors.headquarters_street && (
            <p className="text-xs text-muted-foreground mt-1">
              Start typing your address and select from suggestions
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="headquarters_city" className="block text-sm font-medium text-foreground mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="headquarters_city"
              type="text"
              name="headquarters_city_manual"
              value={formData.headquarters_city}
              onChange={(e) => onChange('headquarters_city', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.headquarters_city ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
              }`}
              placeholder="New York"
              autoComplete="new-password"
              required
            />
            {errors.headquarters_city && (
              <p className="mt-1 text-xs text-red-500">{errors.headquarters_city}</p>
            )}
          </div>

          <div>
            <label htmlFor="headquarters_zip_code" className="block text-sm font-medium text-foreground mb-2">
              ZIP/Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              id="headquarters_zip_code"
              type="text"
              name="headquarters_zip_code_manual"
              value={formData.headquarters_zip_code}
              onChange={(e) => onChange('headquarters_zip_code', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.headquarters_zip_code ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
              }`}
              placeholder="10001"
              autoComplete="new-password"
              required
            />
            {errors.headquarters_zip_code && (
              <p className="mt-1 text-xs text-red-500">{errors.headquarters_zip_code}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="headquarters_address_complement" className="block text-sm font-medium text-foreground mb-1">
            Additional Address Information
          </label>
          <input
            id="headquarters_address_complement"
            type="text"
            name="headquarters_address_complement_manual"
            value={formData.headquarters_address_complement}
            onChange={(e) => onChange('headquarters_address_complement', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Suite 200, Building A"
            autoComplete="new-password"
          />
        </div>
      </div>
    </div>
  );
}
