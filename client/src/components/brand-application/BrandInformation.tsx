"use client";

import { FileUpload } from "./FileUpload";

interface BrandInformationProps {
  formData: {
    brand_name: string;
    industry_type: string;
    description: string;
    website_url: string;
    logo_url: string;
  };
  onChange: (field: string, value: string) => void;
}

export function BrandInformation({ formData, onChange }: BrandInformationProps) {
  const industries = [
    'Fashion',
    'Technology',
    'Food & Beverage',
    'Health & Wellness',
    'Entertainment',
    'Sports',
    'Education',
    'Finance',
    'Automotive',
    'Beauty',
    'Travel',
    'Art',
    'Music',
    'Gaming',
    'Environment',
    'Other'
  ];

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
            value={formData.brand_name}
            onChange={(e) => onChange('brand_name', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Your Brand Name"
            required
          />
        </div>

        <div>
          <label htmlFor="industry_type" className="block text-sm font-medium text-foreground mb-2">
            Industry Type <span className="text-red-500">*</span>
          </label>
          <select
            id="industry_type"
            value={formData.industry_type}
            onChange={(e) => onChange('industry_type', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            required
          >
            <option value="">Select an industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Brand Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[100px]"
            placeholder="Describe your brand, mission, and values..."
          />
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-foreground mb-2">
            Website URL
          </label>
          <input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => onChange('website_url', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="https://www.yourbrand.com"
          />
        </div>

        <div>
          <FileUpload
            value={formData.logo_url}
            onChange={(url) => onChange('logo_url', url)}
            accept=".png,.svg,.jpeg,.jpg,image/png,image/svg+xml,image/jpeg"
            label="Brand Logo"
            description="Upload your brand logo (PNG, SVG, or JPEG)"
          />
          {formData.logo_url && !formData.logo_url.startsWith('data:') && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Or provide a URL:</p>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => onChange('logo_url', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                placeholder="https://www.yourbrand.com/logo.png"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
