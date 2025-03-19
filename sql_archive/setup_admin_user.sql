-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users if it doesn't exist (this is normally handled by Supabase but we'll ensure it exists)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY,
  email text,
  encrypted_password text,
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token text,
  confirmation_sent_at timestamp with time zone,
  recovery_token text,
  recovery_sent_at timestamp with time zone,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text NULL,
  phone_confirmed_at timestamp with time zone NULL,
  phone_change text NULL,
  phone_change_token text NULL,
  phone_change_sent_at timestamp with time zone NULL,
  confirmed_at timestamp with time zone NULL GENERATED ALWAYS AS (email_confirmed_at) STORED,
  email_change_token_current text NULL,
  email_change_confirm_status smallint NULL,
  banned_until timestamp with time zone NULL,
  reauthentication_token text NULL,
  reauthentication_sent_at timestamp with time zone NULL,
  is_sso_user boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone NULL,
  role text DEFAULT 'authenticated'
);

-- Grant necessary permissions on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;

-- Insert or update the admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
) VALUES (
  '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
  'adam@sandlerdigital.ai',
  crypt('temppass123', gen_salt('bf')), -- You'll need to change this password
  now(),
  jsonb_build_object(
    'name', 'Adam Sandler',
    'role', 'admin'
  ),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'admin'
  ),
  true,
  'authenticated'
) ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    is_super_admin = EXCLUDED.is_super_admin,
    role = EXCLUDED.role;

-- Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS public;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure user exists in public.users table
INSERT INTO public.users (
  id,
  email,
  name,
  role
) VALUES (
  '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
  'adam@sandlerdigital.ai',
  'Adam Sandler',
  'admin'
) ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure RLS policies are in place
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users table
DROP POLICY IF EXISTS "Public read access" ON public.users;
CREATE POLICY "Public read access"
ON public.users
FOR SELECT
TO public
USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admin users to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
CREATE POLICY "Admins can manage all profiles"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = auth.users.id
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to auth.users
DROP POLICY IF EXISTS "Public read access" ON auth.users;
CREATE POLICY "Public read access"
ON auth.users
FOR SELECT
TO public
USING (true);

-- Allow users to update their own auth data
DROP POLICY IF EXISTS "Users can update own auth data" ON auth.users;
CREATE POLICY "Users can update own auth data"
ON auth.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to manage all auth data
DROP POLICY IF EXISTS "Admins can manage all auth data" ON auth.users;
CREATE POLICY "Admins can manage all auth data"
ON auth.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = auth.users.id
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
); 