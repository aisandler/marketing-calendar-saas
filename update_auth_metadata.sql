-- Update the user's metadata in auth.users to include role
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'name', 'Adam Sandler'
)
WHERE id = '1e7c7d5f-972a-4eb6-a1f0-58086a174c08';

-- Update the user's role in auth.users
UPDATE auth.users
SET role = 'authenticated'
WHERE id = '1e7c7d5f-972a-4eb6-a1f0-58086a174c08'; 