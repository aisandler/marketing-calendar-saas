-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure schemas exist
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Create auth.users if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY,
    email text,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    is_super_admin boolean,
    role text DEFAULT 'authenticated'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create public.users if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'manager', 'contributor')),
    created_at timestamp with time zone DEFAULT now(),
    avatar_url text
);

-- Insert test user into auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    'f0f41ca2-0c0c-4c80-b3e9-e3c2c63c8df6',
    'test@sandlerdigital.ai',
    crypt('Test123!', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email'],
        'role', 'admin'
    ),
    jsonb_build_object(
        'name', 'Test Admin',
        'role', 'admin'
    ),
    true,
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    is_super_admin = EXCLUDED.is_super_admin;

-- Insert test user into public.users
INSERT INTO public.users (
    id,
    email,
    name,
    role
) VALUES (
    'f0f41ca2-0c0c-4c80-b3e9-e3c2c63c8df6',
    'test@sandlerdigital.ai',
    'Test Admin',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Public read access" ON auth.users;
CREATE POLICY "Public read access" ON auth.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own auth data" ON auth.users;
CREATE POLICY "Users can update own auth data" ON auth.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public read access" ON public.users;
CREATE POLICY "Public read access" ON public.users
    FOR SELECT USING (true);

-- Verify the user was created (with type casting to ensure compatibility)
SELECT 
    'auth.users'::text as source, 
    id, 
    email, 
    role::text as role, 
    raw_app_meta_data->>'role' as app_role 
FROM auth.users 
WHERE email = 'test@sandlerdigital.ai'
UNION ALL
SELECT 
    'public.users'::text as source, 
    id, 
    email, 
    role::text as role, 
    NULL::text as app_role
FROM public.users 
WHERE email = 'test@sandlerdigital.ai'; 