-- First, ensure the auth user exists with the correct metadata
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    phone,
    phone_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '1e7c7d5f-972a-4eb6-a1f0-58086a174c08',
    '00000000-0000-0000-0000-000000000000',
    'adam@sandlerdigital.ai',
    crypt('TEMP_PASSWORD_CHANGE_THIS', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    jsonb_build_object(
        'role', 'admin',
        'name', 'Adam Sandler'
    ),
    jsonb_build_object(
        'role', 'admin',
        'name', 'Adam Sandler'
    ),
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    raw_app_meta_data = jsonb_build_object(
        'role', 'admin',
        'name', 'Adam Sandler'
    ),
    raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'name', 'Adam Sandler'
    ),
    role = 'authenticated';

-- Verify both records exist and match
SELECT 'auth.users' as table_name, id, email, role, raw_app_meta_data->>'role' as app_role 
FROM auth.users 
WHERE email = 'adam@sandlerdigital.ai'
UNION ALL
SELECT 'public.users' as table_name, id, email, role, NULL 
FROM public.users 
WHERE email = 'adam@sandlerdigital.ai'; 