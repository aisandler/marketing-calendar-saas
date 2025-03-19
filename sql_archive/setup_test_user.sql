-- Create public.users if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'manager', 'contributor')),
    created_at timestamp with time zone DEFAULT now(),
    avatar_url text
);

-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Insert the user into public.users (replace USER_ID with the actual UUID from Supabase Auth)
INSERT INTO public.users (id, email, name, role)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- This will be replaced with the actual UUID
    'test@sandlerdigital.ai',
    'Test User',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role; 