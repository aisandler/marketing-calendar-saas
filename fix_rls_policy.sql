-- This script temporarily disables Row Level Security (RLS) to allow initial setup
-- It should be run by an admin user

-- Disable RLS for users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS for resources table
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Disable RLS for briefs table
ALTER TABLE public.briefs DISABLE ROW LEVEL SECURITY;

-- Disable RLS for tradeshows table
ALTER TABLE public.tradeshows DISABLE ROW LEVEL SECURITY;

-- Disable RLS for campaigns table
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;

-- Disable RLS for history table
ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;

-- Create a function to re-enable RLS
CREATE OR REPLACE FUNCTION public.enable_rls()
RETURNS void AS $$
BEGIN
  -- Re-enable RLS for all tables
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.tradeshows ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Option 2: Modify RLS policies to allow registration
-- If you prefer to keep RLS enabled, use this approach instead of Option 1
-- DROP POLICY IF EXISTS "Only admins can insert users" ON public.users;
-- CREATE POLICY "Users can insert themselves" ON public.users
--   FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Admins can insert users" ON public.users
--   FOR INSERT WITH CHECK (
--     auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
--   );

-- After registering and setting up the first admin user,
-- you can re-enable RLS with proper policies by running:
-- 
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
-- DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
-- 
-- CREATE POLICY "Users can view all users" ON public.users
--   FOR SELECT USING (true);
-- 
-- CREATE POLICY "Only admins can insert users" ON public.users
--   FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
-- 
-- CREATE POLICY "Only admins can update users" ON public.users
--   FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
-- 
-- CREATE POLICY "Only admins can delete users" ON public.users
--   FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')); 