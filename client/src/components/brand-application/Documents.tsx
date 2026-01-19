"use client";

import { FileUpload } from "./FileUpload";

interface DocumentsProps {
  formData: {
    registration_proof_url: string;
  };
  onChange: (field: string, value: string) => void;
}

export function Documents({ formData, onChange }: DocumentsProps) {
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
            description="Upload your business registration document (PDF only)"
            required
          />
          {formData.registration_proof_url && !formData.registration_proof_url.startsWith('data:') && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Or provide a URL:</p>
              <input
                type="url"
                value={formData.registration_proof_url}
                onChange={(e) => onChange('registration_proof_url', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                placeholder="https://example.com/document.pdf"
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-accent/20 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Required Documents:</h3>
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
