"use client";

import { FileUpload } from "./FileUpload";

interface DocumentsProps {
  formData: {
    registration_proof_url: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function Documents({ formData, onChange, errors = {} }: DocumentsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload proof of business registration
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <FileUpload
            value={formData.registration_proof_url}
            onChange={(url) => onChange('registration_proof_url', url)}
            accept=".pdf,application/pdf"
            label="Business Registration Proof"
            description="Upload your business registration document (PDF only) - Optional but recommended"
            fieldName="registration_proof_url"
            error={errors.registration_proof_url}
          />
        </div>

        <div className="rounded-lg border border-blue-400/30 bg-blue-400/10 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommended Documents
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Providing these documents will <strong className="text-foreground">accelerate the review process</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Official business registration certificate</li>
            <li>Company incorporation documents</li>
            <li>Tax registration proof (if applicable)</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
