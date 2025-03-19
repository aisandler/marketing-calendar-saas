-- Disable RLS temporarily
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Ensure the users table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'contributor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avatar_url TEXT
);

-- Create a test user (this will fail if the user already exists)
INSERT INTO public.users (id, name, email, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test Admin',
    'test@example.com',
    'admin',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert users" ON public.users;
CREATE POLICY "Only admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    );

DROP POLICY IF EXISTS "Only admins can update users" ON public.users;
CREATE POLICY "Only admins can update users" ON public.users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    );

DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;
CREATE POLICY "Only admins can delete users" ON public.users
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    ); 