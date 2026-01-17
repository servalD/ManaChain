-- Migration script: Add industry_type field and brand_interest table
-- Execute this script if you have an existing database with the old schema

-- Step 1: Add industry_type column to brand table
ALTER TABLE brand 
  ADD COLUMN IF NOT EXISTS industry_type TEXT;

-- Step 2: If you have existing data, you may need to set default values
-- Example: set a default industry type for existing brands
-- UPDATE brand SET industry_type = 'other' WHERE industry_type IS NULL;

-- Step 3: Make industry_type NOT NULL (after setting values for existing rows)
-- ALTER TABLE brand 
--   ALTER COLUMN industry_type SET NOT NULL;

-- Step 4: Create brand_interest table for many-to-many relationship
CREATE TABLE IF NOT EXISTS brand_interest (
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  interest_id TEXT NOT NULL REFERENCES interest(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_id, interest_id)
);

-- Step 5: Create indexes for brand_interest
CREATE INDEX IF NOT EXISTS idx_brand_interest_brand_id ON brand_interest(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_interest_interest_id ON brand_interest(interest_id);

-- Step 6: Migrate existing interest_id to brand_interest table
-- If you have existing data in brand.interest_id, migrate it:
-- INSERT INTO brand_interest (brand_id, interest_id)
-- SELECT id, interest_id FROM brand WHERE interest_id IS NOT NULL
-- ON CONFLICT DO NOTHING;

-- Step 7: Drop the old interest_id column from brand
-- ALTER TABLE brand 
--   DROP COLUMN IF EXISTS interest_id;

-- Step 8: Update indexes
-- Drop old index
DROP INDEX IF EXISTS idx_brand_interest_id;

-- Create new index for industry_type
CREATE INDEX IF NOT EXISTS idx_brand_industry_type ON brand(industry_type);

-- Step 9: Add comments
COMMENT ON TABLE brand_interest IS 'Many-to-many relationship between brands and interests';
COMMENT ON COLUMN brand.industry_type IS 'Type of industry (restaurant, clothing, technology, etc.)';

-- Example industry types you might want to use:
-- 'restaurant', 'clothing', 'technology', 'beauty', 'health', 'education',
-- 'entertainment', 'finance', 'automotive', 'real_estate', 'consulting',
-- 'manufacturing', 'retail', 'services', 'agriculture', 'construction', 'other'
