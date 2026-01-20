-- Migration: Add email verification fields to brand_application table
-- Date: 2026-01-20

-- Add email verification columns
ALTER TABLE brand_application
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for email verification token lookups
CREATE INDEX IF NOT EXISTS idx_brand_application_email_verification_token 
ON brand_application(email_verification_token);

-- Add comment for documentation
COMMENT ON COLUMN brand_application.email_verification_token IS 'Token for email verification of brand application contact email';
COMMENT ON COLUMN brand_application.email_verification_expires IS 'Expiration date of email verification token (24 hours from creation)';
COMMENT ON COLUMN brand_application.email_verified IS 'Whether the contact email has been verified';
