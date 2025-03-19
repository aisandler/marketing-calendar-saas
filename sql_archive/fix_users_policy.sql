-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy to allow users to view all profiles
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Ensure the authenticated role has proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Verify the user exists and has correct data
INSERT INTO public.users (id, email, name, role, created_at)
VALUES (
  '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
  'adam@sandlerdigital.ai',
  'Adam Sandler',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    name = 'Adam Sandler'; 