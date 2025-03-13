-- First make sure we have a default brand
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for migration purposes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

-- Add columns if they don't exist (making them nullable first)
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to use the default brand
UPDATE briefs SET brand_id = (SELECT id FROM brands ORDER BY created_at LIMIT 1) WHERE brand_id IS NULL;

-- Now we can enforce the NOT NULL constraint
ALTER TABLE briefs ALTER COLUMN brand_id SET NOT NULL;

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON briefs(resource_id);
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();