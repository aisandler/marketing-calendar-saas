-- First insert a default brand if one doesn't exist
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for migration purposes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

-- Get the ID of the first brand to use as default
DO $$
DECLARE
    default_brand_id UUID;
BEGIN
    -- Get the default brand ID
    SELECT id INTO default_brand_id FROM brands ORDER BY created_at LIMIT 1;

    -- Add missing columns to briefs table, making brand_id nullable for now
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    -- Update all existing briefs to use the first brand if brand_id is null
    UPDATE briefs SET brand_id = default_brand_id WHERE brand_id IS NULL;

    -- Now add NOT NULL constraint
    ALTER TABLE briefs ALTER COLUMN brand_id SET NOT NULL;
END $$;

-- Create index for resource_id
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON briefs(resource_id);

-- Create index for campaign_id
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON briefs(campaign_id);

-- Create index for brand_id
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);

-- Update all existing briefs to use the first brand if brand_id is null
UPDATE briefs SET brand_id = (SELECT id FROM brands ORDER BY created_at LIMIT 1) 
WHERE brand_id IS NULL;

-- Now add NOT NULL constraint to brand_id if not already set
ALTER TABLE briefs ALTER COLUMN brand_id SET NOT NULL;

-- Ensure the updated_at trigger is working
DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();