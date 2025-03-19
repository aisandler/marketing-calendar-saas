-- First, ensure RLS is disabled temporarily for the operation
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Update the user's role in public.users to ensure it's admin
UPDATE public.users
SET role = 'admin'
WHERE id = '1e7c7d5f-972a-4eb6-a1f0-58086a174c08';

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the update
SELECT id, email, role FROM public.users WHERE id = '1e7c7d5f-972a-4eb6-a1f0-58086a174c08'; 