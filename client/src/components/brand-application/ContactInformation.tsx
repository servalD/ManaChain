"use client";

interface ContactInformationProps {
  formData: {
    contact_email: string;
    contact_first_name: string;
    contact_last_name: string;
    contact_phone: string;
  };
  onChange: (field: string, value: string) => void;
}

export function ContactInformation({ formData, onChange }: ContactInformationProps) {
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
              value={formData.contact_first_name}
              onChange={(e) => onChange('contact_first_name', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label htmlFor="contact_last_name" className="block text-sm font-medium text-foreground mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_last_name"
              type="text"
              value={formData.contact_last_name}
              onChange={(e) => onChange('contact_last_name', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-foreground mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => onChange('contact_email', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="john.doe@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-foreground mb-1">
            Phone Number
          </label>
          <input
            id="contact_phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => onChange('contact_phone', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
    </div>
  );
}
