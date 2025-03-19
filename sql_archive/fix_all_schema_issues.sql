-- Comprehensive fix for all schema issues

-- Make sure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------
-- Fix resources table
-----------------------------------------
-- Add missing columns to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC DEFAULT 40;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT NULL;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Ensure the updated_at trigger is working for resources
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for team_id
CREATE INDEX IF NOT EXISTS idx_resources_team_id ON resources(team_id);

-----------------------------------------
-- Fix briefs table
-----------------------------------------
-- Add missing columns to briefs table
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS expenses NUMERIC DEFAULT 0;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Ensure the updated_at trigger is working for briefs
DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create helpful indexes for briefs
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON briefs(resource_id);
CREATE INDEX IF NOT EXISTS idx_briefs_approver_id ON briefs(approver_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_by ON briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);

-----------------------------------------
-- Create teams table if it doesn't exist
-----------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for teams updated_at
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default teams if none exist
INSERT INTO teams (name, description)
SELECT 'Design', 'Visual design and creative team'
WHERE NOT EXISTS (SELECT 1 FROM teams LIMIT 1);

INSERT INTO teams (name, description)
SELECT 'Content', 'Content creation and copywriting team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Content');

INSERT INTO teams (name, description)
SELECT 'Digital Marketing', 'Digital and social media marketing team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Digital Marketing');

INSERT INTO teams (name, description)
SELECT 'Video Production', 'Video editing and production team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Video Production');

INSERT INTO teams (name, description)
SELECT 'Web Development', 'Web and app development team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Web Development');

-----------------------------------------
-- Make sure brands table exists and has proper columns
-----------------------------------------
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default brand if none exists
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for marketing calendar', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

-- Ensure the updated_at trigger is working for brands
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 