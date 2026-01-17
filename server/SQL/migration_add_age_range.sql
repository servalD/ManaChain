-- Migration script: Add age_range field to user table
-- Execute this script if you have an existing database

-- Add age_range column to user table
ALTER TABLE "user" 
  ADD COLUMN IF NOT EXISTS age_range TEXT;

-- Add constraint for valid age ranges
ALTER TABLE "user"
  ADD CONSTRAINT chk_age_range 
  CHECK (age_range IS NULL OR age_range IN ('under_18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'));

-- Add comment
COMMENT ON COLUMN "user".age_range IS 'Age range of the user (under_18, 18-24, 25-34, 35-44, 45-54, 55-64, 65+)';

-- Note: The age_range is optional (nullable) to maintain compatibility with existing users
-- Valid values are: 'under_18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
