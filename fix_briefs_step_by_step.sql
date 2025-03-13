-- Step 1: Make sure we have a default brand
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for migration purposes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

-- Step 2: Add resource_id column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);

-- Step 3: Add brand_id column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- Step 4: Add campaign_id column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- Step 5: Add approver_id column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id);

-- Step 6: Add created_by column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Step 7: Add updated_at column if it doesn't exist
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 8: Update existing rows to use the default brand
UPDATE briefs SET brand_id = (SELECT id FROM brands ORDER BY created_at LIMIT 1) WHERE brand_id IS NULL;

-- Step 9: Now we can enforce the NOT NULL constraint
ALTER TABLE briefs ALTER COLUMN brand_id SET NOT NULL;

-- Step 10: Create index for resource_id
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON briefs(resource_id);

-- Step 11: Create index for campaign_id
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON briefs(campaign_id);

-- Step 12: Create index for brand_id
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);

-- Step 13: Add trigger for updated_at
DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();