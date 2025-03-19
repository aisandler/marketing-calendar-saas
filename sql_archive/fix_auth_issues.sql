-- Step 1: Clean up existing data
DELETE FROM auth.users WHERE email = 'adam@sandlerdigital.ai';
DELETE FROM public.users WHERE email = 'adam@sandlerdigital.ai';

-- Step 2: Make sure RLS is disabled for the users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: After creating a user in Supabase Authentication UI,
-- run this query to get the UUID (replace the email if different)
-- SELECT id FROM auth.users WHERE email = 'adam@sandlerdigital.ai';

-- Step 4: Create a database user with the matching UUID
-- Replace 'paste-the-uuid-here' with the actual UUID from Step 3
-- INSERT INTO public.users (id, name, email, role, created_at)
-- VALUES ('paste-the-uuid-here', 'Adam Sandler', 'adam@sandlerdigital.ai', 'admin', NOW());

-- Step 5: After successful login, you can re-enable RLS if desired
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
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