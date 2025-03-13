-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_id to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Create index on team_id for faster joins
CREATE INDEX IF NOT EXISTS idx_resources_team_id ON resources(team_id);

-- Add RLS policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Everyone can view teams
CREATE POLICY "Teams are viewable by all authenticated users" 
ON teams FOR SELECT 
TO authenticated 
USING (true);

-- Only admins and managers can insert/update/delete teams
CREATE POLICY "Teams are insertable by admins and managers" 
ON teams FOR INSERT 
TO authenticated 
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Teams are updatable by admins and managers" 
ON teams FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Teams are deletable by admins and managers" 
ON teams FOR DELETE 
TO authenticated 
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Insert some initial teams
INSERT INTO teams (name, description) VALUES
('Design', 'Visual design and creative team'),
('Content', 'Content creation and copywriting team'),
('Digital Marketing', 'Digital and social media marketing team'),
('Video Production', 'Video editing and production team'),
('Web Development', 'Web and app development team')
ON CONFLICT (id) DO NOTHING;