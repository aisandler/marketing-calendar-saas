-- First, disable RLS temporarily to see if that's the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.users;

-- Grant full access temporarily for debugging
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Create access logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.access_logs (
  id SERIAL PRIMARY KEY,
  operation TEXT,
  user_id UUID,
  table_name TEXT,
  timestamp TIMESTAMPTZ
);

-- Create a function to log access attempts
CREATE OR REPLACE FUNCTION log_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.access_logs (
    operation,
    user_id,
    table_name,
    timestamp
  ) VALUES (
    TG_OP,
    auth.uid(),
    TG_TABLE_NAME,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for write operations
DROP TRIGGER IF EXISTS users_write_log ON public.users;
CREATE TRIGGER users_write_log
  BEFORE INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH STATEMENT
  EXECUTE FUNCTION log_access();

-- Verify current settings
SELECT tablename, schemaname, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- List all permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'users'; 