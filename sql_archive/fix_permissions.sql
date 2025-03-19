-- First, revoke all existing permissions to start clean
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM authenticated;
REVOKE ALL ON public.users FROM auth_user_1e7c7d5f_972a_4eb6_a1f0_58086a174c08;

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.users;

-- Grant minimal required permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Reset the owner to postgres to ensure proper permissions hierarchy
ALTER TABLE public.users OWNER TO postgres;

-- Verify the changes
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type; 