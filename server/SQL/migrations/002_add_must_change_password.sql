-- Migration: Add password_changed column for brand first-login password change requirement
-- When a brand is approved, they receive a generated password. This flag forces them to set their own password on first login.

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN "user".password_changed IS 'False when brand must change password on first login (approved with generated password). Default TRUE for existing users.';
