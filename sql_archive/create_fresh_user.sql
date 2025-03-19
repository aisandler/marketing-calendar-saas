-- First, clean up any existing test user
DELETE FROM auth.users WHERE email = 'test@sandlerdigital.ai';
DELETE FROM public.users WHERE email = 'test@sandlerdigital.ai';

-- Create a new test user in auth.users
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
);

-- Create corresponding user in public.users
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at
) VALUES (
    'f0f41ca2-0c0c-4c80-b3e9-e3c2c63c8df6',
    'test@sandlerdigital.ai',
    'Test Admin',
    'admin',
    now()
);

-- Double check permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Public read access" ON auth.users;
CREATE POLICY "Public read access" ON auth.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own auth data" ON auth.users;
CREATE POLICY "Users can update own auth data" ON auth.users
    FOR UPDATE USING (auth.uid() = id);

-- Verify the user was created
SELECT 'auth.users' as source, id, email, role, raw_app_meta_data->>'role' as app_role 
FROM auth.users 
WHERE email = 'test@sandlerdigital.ai'
UNION ALL
SELECT 'public.users' as source, id, email, role, NULL 
FROM public.users 
WHERE email = 'test@sandlerdigital.ai'; 