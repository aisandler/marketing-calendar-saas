-- First check if resources table exists
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    team TEXT,
    media_type TEXT,
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    organization_id UUID
);

-- Disable RLS temporarily on resources table
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on resources
DROP POLICY IF EXISTS "Public read access" ON public.resources;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
DROP POLICY IF EXISTS "Users can insert resources" ON public.resources;

-- Grant permissions for resources table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.resources TO anon;
GRANT ALL ON public.resources TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS resources_name_idx ON public.resources(name);
CREATE INDEX IF NOT EXISTS resources_type_idx ON public.resources(type);

-- Reset the owner to postgres
ALTER TABLE public.resources OWNER TO postgres;

-- Add some sample data if table is empty
INSERT INTO public.resources (name, type, team, media_type, capacity)
SELECT 'Sample Resource 1', 'Equipment', 'Marketing', 'Video', 100
WHERE NOT EXISTS (SELECT 1 FROM public.resources LIMIT 1);

-- Verify the changes
SELECT tablename, schemaname, rowsecurity 
FROM pg_tables 
WHERE tablename = 'resources';

-- List permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'resources' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type; 