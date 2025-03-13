-- Replace these values with the actual user details from Supabase Auth
-- UUID: The user's UUID from Supabase Auth
-- EMAIL: The email address used to create the user
-- NAME: The user's display name

-- Create admin user with provided UUID and email
INSERT INTO public.users (id, name, email, role, created_at)
VALUES (
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
    'Adam Sandler',
    'adam@sandlerdigital.ai',
    'admin',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role; 