-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON auth.users;
DROP POLICY IF EXISTS "Anyone can read auth users" ON auth.users;
DROP POLICY IF EXISTS "Users can update own auth data" ON auth.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for public.users
CREATE POLICY "Anyone can read users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create more permissive policies for auth.users
CREATE POLICY "Anyone can read auth users" ON auth.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own auth data" ON auth.users
    FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;

-- Update user metadata and ensure user exists in both tables
DO $$
DECLARE
    user_id uuid;
    role_name text;
BEGIN
    -- First, update the auth.users table with proper metadata
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_build_object(
        'role', 'admin',
        'provider', 'email'
    ),
    raw_user_meta_data = jsonb_build_object(
        'name', 'Adam Sandler',
        'email', 'adam@sandlerdigital.ai'
    )
    WHERE email = 'adam@sandlerdigital.ai'
    RETURNING id INTO user_id;

    IF user_id IS NOT NULL THEN
        -- Set up role name
        role_name := 'auth_user_' || replace(user_id::text, '-', '_');
        
        -- Create role if it doesn't exist (will do nothing if it exists)
        BEGIN
            EXECUTE format('CREATE ROLE %I WITH NOLOGIN', role_name);
        EXCEPTION WHEN duplicate_object THEN
            NULL;  -- Role already exists, ignore error
        END;
        
        -- Grant necessary permissions
        EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', role_name);
        EXECUTE format('GRANT USAGE ON SCHEMA auth TO %I', role_name);
        EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA public TO %I', role_name);
        EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA auth TO %I', role_name);
        
        -- Insert into public.users if not exists
        INSERT INTO public.users (id, email, name, role)
        VALUES (user_id, 'adam@sandlerdigital.ai', 'Adam Sandler', 'admin')
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role;
    END IF;
END $$;

-- Verify the setup
SELECT 
    'auth.users'::text as source,
    id,
    email,
    raw_app_meta_data->>'role' as role,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'adam@sandlerdigital.ai'
UNION ALL
SELECT 
    'public.users'::text as source,
    id,
    email,
    role::text as role,
    NULL::jsonb as raw_app_meta_data,
    NULL::jsonb as raw_user_meta_data
FROM public.users 
WHERE email = 'adam@sandlerdigital.ai'; 