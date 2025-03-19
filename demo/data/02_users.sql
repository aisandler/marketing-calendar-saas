-- Demo Data Generation: Users
-- This script creates a set of demo users with different roles

-- Create admin users
INSERT INTO public.users (email, name, role, avatar_url)
VALUES 
    ('admin.demo@example.com', 'Alex Director', 'admin', 'https://ui-avatars.com/api/?name=Alex+Director&background=0D8ABC&color=fff'),
    ('cmo.demo@example.com', 'Taylor Johnson', 'admin', 'https://ui-avatars.com/api/?name=Taylor+Johnson&background=27AE60&color=fff')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;

-- Create manager users
INSERT INTO public.users (email, name, role, avatar_url)
VALUES 
    ('manager1.demo@example.com', 'Jordan Smith', 'manager', 'https://ui-avatars.com/api/?name=Jordan+Smith&background=F39C12&color=fff'),
    ('manager2.demo@example.com', 'Casey Wilson', 'manager', 'https://ui-avatars.com/api/?name=Casey+Wilson&background=8E44AD&color=fff'),
    ('manager3.demo@example.com', 'Morgan Davis', 'manager', 'https://ui-avatars.com/api/?name=Morgan+Davis&background=E74C3C&color=fff'),
    ('manager4.demo@example.com', 'Riley Roberts', 'manager', 'https://ui-avatars.com/api/?name=Riley+Roberts&background=16A085&color=fff'),
    ('manager5.demo@example.com', 'Avery Martin', 'manager', 'https://ui-avatars.com/api/?name=Avery+Martin&background=2C3E50&color=fff')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;

-- Create contributor users
INSERT INTO public.users (email, name, role, avatar_url)
VALUES 
    ('designer1.demo@example.com', 'Sam Thompson', 'contributor', 'https://ui-avatars.com/api/?name=Sam+Thompson&background=3498DB&color=fff'),
    ('designer2.demo@example.com', 'Jamie Garcia', 'contributor', 'https://ui-avatars.com/api/?name=Jamie+Garcia&background=3498DB&color=fff'),
    ('copywriter1.demo@example.com', 'Drew Anderson', 'contributor', 'https://ui-avatars.com/api/?name=Drew+Anderson&background=F1C40F&color=fff'),
    ('copywriter2.demo@example.com', 'Finley Cooper', 'contributor', 'https://ui-avatars.com/api/?name=Finley+Cooper&background=F1C40F&color=fff'),
    ('developer1.demo@example.com', 'Quinn Evans', 'contributor', 'https://ui-avatars.com/api/?name=Quinn+Evans&background=9B59B6&color=fff'),
    ('developer2.demo@example.com', 'Parker Nelson', 'contributor', 'https://ui-avatars.com/api/?name=Parker+Nelson&background=9B59B6&color=fff'),
    ('video1.demo@example.com', 'Robin Carter', 'contributor', 'https://ui-avatars.com/api/?name=Robin+Carter&background=E67E22&color=fff'),
    ('social1.demo@example.com', 'Skyler Wright', 'contributor', 'https://ui-avatars.com/api/?name=Skyler+Wright&background=2ECC71&color=fff'),
    ('social2.demo@example.com', 'Charlie Baker', 'contributor', 'https://ui-avatars.com/api/?name=Charlie+Baker&background=2ECC71&color=fff'),
    ('analyst1.demo@example.com', 'Blake Mitchell', 'contributor', 'https://ui-avatars.com/api/?name=Blake+Mitchell&background=1ABC9C&color=fff')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;

-- Output user counts
DO $$
DECLARE
    admin_count INTEGER;
    manager_count INTEGER;
    contributor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
    SELECT COUNT(*) INTO manager_count FROM public.users WHERE role = 'manager';
    SELECT COUNT(*) INTO contributor_count FROM public.users WHERE role = 'contributor';
    
    RAISE NOTICE 'Demo users created: % admins, % managers, % contributors', 
        admin_count, manager_count, contributor_count;
END;
$$; 