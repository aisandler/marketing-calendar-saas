-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_id to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Create index on team_id for faster joins
CREATE INDEX IF NOT EXISTS idx_resources_team_id ON public.resources(team_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Only admins and managers can insert/update/delete teams
CREATE POLICY "Teams are insertable by admins and managers"
ON public.teams FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Teams are updatable by admins and managers"
ON public.teams FOR UPDATE
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Teams are deletable by admins and managers"
ON public.teams FOR DELETE
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Everyone can view teams
CREATE POLICY "Teams are viewable by all users"
ON public.teams FOR SELECT
USING (true);

-- Insert some initial teams
INSERT INTO public.teams (name, description) VALUES
('Design', 'Visual design and creative team'),
('Content', 'Content creation and copywriting team'),
('Digital Marketing', 'Digital and social media marketing team'),
('Video Production', 'Video editing and production team'),
('Web Development', 'Web and app development team')
ON CONFLICT (id) DO NOTHING;