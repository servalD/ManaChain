"use client";

import { useState, useEffect } from "react";
import { COUNTRY_PHONE_CODES, CountryPhoneCode } from "@/utils/constants";

interface ContactInformationProps {
  formData: {
    contact_email: string;
    contact_first_name: string;
    contact_last_name: string;
    contact_phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  selectedCountryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

export function ContactInformation({ 
  formData, 
  onChange, 
  errors = {},
  selectedCountryCode = 'GB',
  onCountryCodeChange
}: ContactInformationProps) {
  const [localCountryCode, setLocalCountryCode] = useState<string>(selectedCountryCode);

  useEffect(() => {
    setLocalCountryCode(selectedCountryCode);
  }, [selectedCountryCode]);

  const selectedCountry = COUNTRY_PHONE_CODES.find(c => c.code === localCountryCode) || COUNTRY_PHONE_CODES.find(c => c.code === 'GB')!;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setLocalCountryCode(newCode);
    if (onCountryCodeChange) {
      onCountryCodeChange(newCode);
    }

    // Update phone number with new country code
    const newCountry = COUNTRY_PHONE_CODES.find(c => c.code === newCode)!;
    const currentPhone = formData.contact_phone || '';
    
    // Remove old country code if present (match + followed by 1-4 digits and optional space)
    const phoneWithoutCode = currentPhone.replace(/^\+\d{1,4}\s?/, '').trim();
    
    // Add new country code with space
    const newPhone = phoneWithoutCode ? `${newCountry.dialCode} ${phoneWithoutCode}` : `${newCountry.dialCode} `;
    onChange('contact_phone', newPhone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // If user starts typing without country code, add it
    if (value && !value.startsWith('+')) {
      value = `${selectedCountry.dialCode} ${value}`;
    }
    
    // Ensure there's a space after the country code
    if (value.startsWith(selectedCountry.dialCode) && value.length > selectedCountry.dialCode.length && !value.startsWith(`${selectedCountry.dialCode} `)) {
      value = `${selectedCountry.dialCode} ${value.substring(selectedCountry.dialCode.length)}`;
    }
    
    onChange('contact_phone', value);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Contact Information</h2>
        <p className="text-sm text-muted-foreground">
          Please provide your contact details
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_first_name" className="block text-sm font-medium text-foreground mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_first_name"
              type="text"
              name="contact_first_name_manual"
              value={formData.contact_first_name}
              onChange={(e) => onChange('contact_first_name', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.contact_first_name ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
              }`}
              placeholder="John"
              autoComplete="new-password"
              required
            />
            {errors.contact_first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_first_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact_last_name" className="block text-sm font-medium text-foreground mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_last_name"
              type="text"
              name="contact_last_name_manual"
              value={formData.contact_last_name}
              onChange={(e) => onChange('contact_last_name', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.contact_last_name ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
              }`}
              placeholder="Doe"
              autoComplete="new-password"
              required
            />
            {errors.contact_last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-foreground mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact_email"
            type="email"
            name="contact_email_manual"
            value={formData.contact_email}
            onChange={(e) => onChange('contact_email', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.contact_email ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="john.doe@example.com"
            autoComplete="new-password"
            required
          />
          {errors.contact_email && (
            <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-foreground mb-1">
            Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={localCountryCode}
              onChange={handleCountryChange}
              className="px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 border-border focus:ring-violet-400 min-w-[80px] text-sm"
              aria-label="Country code"
            >
              {COUNTRY_PHONE_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.dialCode}
                </option>
              ))}
            </select>
            <input
              id="contact_phone"
              type="tel"
              name="contact_phone_manual"
              value={formData.contact_phone}
              onChange={handlePhoneChange}
              className={`flex-1 px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.contact_phone ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
              }`}
              placeholder={`${selectedCountry.dialCode} (555) 123-4567`}
              autoComplete="new-password"
            />
          </div>
          {errors.contact_phone && (
            <p className="mt-1 text-xs text-red-500">{errors.contact_phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
