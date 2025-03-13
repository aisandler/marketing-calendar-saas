-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table with required fields
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
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text NULL,
    phone_confirmed_at timestamp with time zone NULL,
    phone_change text NULL,
    phone_change_token text NULL,
    phone_change_sent_at timestamp with time zone NULL,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (email_confirmed_at) STORED,
    email_change_token_current text NULL,
    email_change_confirm_status smallint NULL,
    banned_until timestamp with time zone NULL,
    reauthentication_token text NULL,
    reauthentication_sent_at timestamp with time zone NULL,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone NULL,
    role text DEFAULT 'authenticated'::text
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auth.users
CREATE POLICY "Public read access" ON auth.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own auth data" ON auth.users
    FOR UPDATE USING (auth.uid() = id);

-- Insert or update the admin user
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
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
    'adam@sandlerdigital.ai',
    crypt('temppass123', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email'],
        'role', 'admin'
    ),
    jsonb_build_object(
        'name', 'Adam Sandler',
        'role', 'admin'
    ),
    true,
    'authenticated'
) ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    is_super_admin = EXCLUDED.is_super_admin,
    role = EXCLUDED.role;

-- Ensure user exists in public.users table
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at
) VALUES (
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
    'adam@sandlerdigital.ai',
    'Adam Sandler',
    'admin',
    now()
) ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now(); 