-- First, ensure the user exists in public.users with admin role
INSERT INTO public.users (id, name, email, role, created_at)
VALUES (
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
    'Adam Sandler',
    'adam@sandlerdigital.ai',
    'admin',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    name = 'Adam Sandler',
    email = 'adam@sandlerdigital.ai';

-- Update the user's metadata in auth.users
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
    'role', 'admin',
    'name', 'Adam Sandler'
),
raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'name', 'Adam Sandler'
),
role = 'authenticated'
WHERE id = '1e7c7d5f-972a-4eb6-a1f0-58086a174c08'; 