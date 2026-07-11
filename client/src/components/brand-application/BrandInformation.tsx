"use client";

import { FileUpload } from "./FileUpload";
import type { InterestResponse } from "@/api/generated/models";
import { Check } from "lucide-react";

interface BrandInformationProps {
  formData: {
    brand_name: string;
    interest_ids: string[];
    description: string;
    website_url: string;
    logo_url: string;
  };
  onChange: (field: string, value: string | string[]) => void;
  interests: InterestResponse[];
  errors?: Record<string, string>;
}

export function BrandInformation({ formData, onChange, interests, errors = {} }: BrandInformationProps) {
  const selectedCount = formData.interest_ids?.length || 0;
  const maxSelections = 2;

  const toggleInterest = (interestId: string) => {
    const currentInterests = formData.interest_ids || [];
    
    if (currentInterests.includes(interestId)) {
      // Remove interest
      const newInterests = currentInterests.filter(id => id !== interestId);
      onChange('interest_ids', newInterests);
    } else {
      // Add interest (if not at max)
      if (currentInterests.length < maxSelections) {
        onChange('interest_ids', [...currentInterests, interestId]);
      }
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Brand Information</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your brand
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="brand_name" className="block text-sm font-medium text-foreground mb-2">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            id="brand_name"
            type="text"
            name="brand_name_manual"
            value={formData.brand_name}
            onChange={(e) => onChange('brand_name', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.brand_name ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="Your Brand Name"
            autoComplete="new-password"
            required
          />
          {errors.brand_name && (
            <p className="mt-1 text-xs text-red-500">{errors.brand_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Brand Interests (Select 1-2) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            {selectedCount}/{maxSelections} selected
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {interests.map((interest) => {
              const isSelected = formData.interest_ids?.includes(interest.id);
              const isDisabled = !isSelected && selectedCount >= maxSelections;
              
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  disabled={isDisabled}
                  className={`
                    relative px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all overflow-hidden
                    ${isSelected 
                      ? 'border-violet-500 bg-violet-500/10 text-foreground' 
                      : 'border-border bg-transparent text-foreground hover:border-violet-400'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {interest.icon && <span className="text-sm sm:text-lg shrink-0">{interest.icon}</span>}
                    <span className="truncate">{interest.label}</span>
                    {isSelected && (
                      <Check className="absolute top-1 right-1 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 text-violet-500 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.interest_ids && (
            <p className="mt-2 text-xs text-red-500">{errors.interest_ids}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Brand Description
          </label>
          <textarea
            id="description"
            name="description_manual"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 min-h-[100px] ${
              errors.description ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="Describe your brand, mission, and values..."
            autoComplete="new-password"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-foreground mb-2">
            Website URL
          </label>
          <input
            id="website_url"
            type="url"
            name="website_url_manual"
            value={formData.website_url}
            onChange={(e) => onChange('website_url', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.website_url ? 'border-red-500 focus:ring-red-400' : 'border-border focus:ring-violet-400'
            }`}
            placeholder="https://www.yourbrand.com"
            autoComplete="new-password"
          />
          {errors.website_url && (
            <p className="mt-1 text-xs text-red-500">{errors.website_url}</p>
          )}
        </div>

        <div>
          <FileUpload
            value={formData.logo_url}
            onChange={(url) => onChange('logo_url', url)}
            accept=".png,.svg,.jpeg,.jpg,image/png,image/svg+xml,image/jpeg"
            label="Brand Logo"
            description="Upload your brand logo (PNG, SVG, or JPEG)"
            fieldName="logo_url"
            error={errors.logo_url}
          />
        </div>
      </div>
    </div>
  );
}
