-- Create public.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'manager', 'contributor')),
    created_at timestamp with time zone DEFAULT now(),
    avatar_url text
);

-- Insert the user into public.users
INSERT INTO public.users (id, email, name, role)
VALUES (
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',  -- This matches the auth.users id
    'adam@sandlerdigital.ai',
    'Adam Sandler',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Public read access" ON public.users;
CREATE POLICY "Public read access" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Verify the user exists in both tables
SELECT 
    'auth.users'::text as source, 
    id, 
    email, 
    role::text as role, 
    raw_app_meta_data->>'role' as app_role 
FROM auth.users 
WHERE email = 'adam@sandlerdigital.ai'
UNION ALL
SELECT 
    'public.users'::text as source, 
    id, 
    email, 
    role::text as role, 
    NULL::text as app_role
FROM public.users 
WHERE email = 'adam@sandlerdigital.ai'; 