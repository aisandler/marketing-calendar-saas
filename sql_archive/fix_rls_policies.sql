-- Drop all existing policies first
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON auth.users;
DROP POLICY IF EXISTS "Users can update own auth data" ON auth.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to read all users
CREATE POLICY "Allow authenticated users to read" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a simple policy that allows users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a simple policy that allows users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'users';
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
UNION ALL
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users'; 