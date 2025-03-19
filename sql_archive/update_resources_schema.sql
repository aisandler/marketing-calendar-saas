-- Add missing columns to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC DEFAULT 40;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT NULL;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the updated_at trigger is working
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_id to resources if it doesn't exist
ALTER TABLE resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Create index for team_id
CREATE INDEX IF NOT EXISTS idx_resources_team_id ON resources(team_id);

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