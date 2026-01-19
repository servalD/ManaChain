"use client";

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
}

export function LegalInformation({ formData, onChange }: LegalInformationProps) {
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
            value={formData.business_registration_number}
            onChange={(e) => onChange('business_registration_number', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="SIRET, EIN, or equivalent"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your SIRET (France), EIN (USA), or equivalent business number
          </p>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) => onChange('country', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="United States"
            required
          />
        </div>

        <div>
          <label htmlFor="headquarters_street" className="block text-sm font-medium text-foreground mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            id="headquarters_street"
            type="text"
            value={formData.headquarters_street}
            onChange={(e) => onChange('headquarters_street', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="headquarters_city" className="block text-sm font-medium text-foreground mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="headquarters_city"
              type="text"
              value={formData.headquarters_city}
              onChange={(e) => onChange('headquarters_city', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="New York"
              required
            />
          </div>

          <div>
            <label htmlFor="headquarters_zip_code" className="block text-sm font-medium text-foreground mb-2">
              ZIP/Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              id="headquarters_zip_code"
              type="text"
              value={formData.headquarters_zip_code}
              onChange={(e) => onChange('headquarters_zip_code', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="10001"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="headquarters_address_complement" className="block text-sm font-medium text-foreground mb-1">
            Additional Address Information
          </label>
          <input
            id="headquarters_address_complement"
            type="text"
            value={formData.headquarters_address_complement}
            onChange={(e) => onChange('headquarters_address_complement', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Suite 200, Building A"
          />
        </div>
      </div>
    </div>
  );
}
