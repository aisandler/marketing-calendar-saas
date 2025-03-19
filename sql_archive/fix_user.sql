-- First, check if the user exists in auth.users
SELECT id, email, raw_app_meta_data, raw_user_meta_data 
FROM auth.users 
WHERE email = 'adam@sandlerdigital.ai';

-- Then check if the user exists in public.users
SELECT id, email, role, name 
FROM public.users 
WHERE email = 'adam@sandlerdigital.ai';

-- Now let's ensure the user exists in both tables with correct data
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Get or create auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'adam@sandlerdigital.ai';

    -- Update auth.users metadata
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_build_object(
        'role', 'admin',
        'provider', 'email'
    ),
    raw_user_meta_data = jsonb_build_object(
        'name', 'Adam Sandler',
        'email', 'adam@sandlerdigital.ai'
    )
    WHERE id = auth_user_id;

    -- Insert or update public.users
    INSERT INTO public.users (id, email, name, role, created_at)
    VALUES (
        auth_user_id,
        'adam@sandlerdigital.ai',
        'Adam Sandler',
        'admin',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role;

    -- Verify the update
    RAISE NOTICE 'Updated user with ID: %', auth_user_id;
END $$;

-- Verify the results
SELECT 'auth.users' as table_name, id, email, raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'adam@sandlerdigital.ai'
UNION ALL
SELECT 'public.users' as table_name, id, email, role::text
FROM public.users 
WHERE email = 'adam@sandlerdigital.ai'; 