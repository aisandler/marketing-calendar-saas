-- Demo Data Generation: Campaigns
-- This script creates campaigns spanning the past year and into the future

-- Helper function to get random user ID
CREATE OR REPLACE FUNCTION demo_random_user(user_role TEXT DEFAULT NULL) 
RETURNS UUID AS $$
DECLARE
    result UUID;
BEGIN
    IF user_role IS NULL THEN
        SELECT id INTO result FROM public.users 
        WHERE email LIKE '%.demo@example.com' 
        ORDER BY random() LIMIT 1;
    ELSE
        SELECT id INTO result FROM public.users 
        WHERE email LIKE '%.demo@example.com' AND role = user_role
        ORDER BY random() LIMIT 1;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a series of campaigns for Acme Corp (Technology)
INSERT INTO public.campaigns (
    name, 
    description, 
    brand_id, 
    start_date, 
    end_date, 
    status, 
    created_by
)
VALUES
    -- Past campaigns (completed)
    (
        'Demo Acme Product Launch Q2', 
        'Launch campaign for our new flagship product line',
        (SELECT id FROM public.brands WHERE name = 'Demo Acme Corp'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '12 months')::DATE, 
            (CURRENT_DATE - INTERVAL '9 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '9 months')::DATE, 
            (CURRENT_DATE - INTERVAL '8 months')::DATE
        ),
        'complete',
        demo_random_user('admin')
    ),
    (
        'Demo Acme Holiday Campaign', 
        'Holiday season promotional campaign for Acme products',
        (SELECT id FROM public.brands WHERE name = 'Demo Acme Corp'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '6 months')::DATE, 
            (CURRENT_DATE - INTERVAL '5 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '4 months')::DATE, 
            (CURRENT_DATE - INTERVAL '3 months')::DATE
        ),
        'complete',
        demo_random_user('admin')
    ),
    
    -- Current campaign (active)
    (
        'Demo Acme Spring Innovation', 
        'Showcasing the latest innovations from Acme Corp',
        (SELECT id FROM public.brands WHERE name = 'Demo Acme Corp'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '2 months')::DATE, 
            (CURRENT_DATE - INTERVAL '1 month')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '1 month')::DATE, 
            (CURRENT_DATE + INTERVAL '2 months')::DATE
        ),
        'active',
        demo_random_user('admin')
    ),
    
    -- Future campaign (draft)
    (
        'Demo Acme Fall Product Refresh', 
        'Product line refresh and promotional campaign',
        (SELECT id FROM public.brands WHERE name = 'Demo Acme Corp'),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '2 months')::DATE, 
            (CURRENT_DATE + INTERVAL '3 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '5 months')::DATE, 
            (CURRENT_DATE + INTERVAL '6 months')::DATE
        ),
        'draft',
        demo_random_user('admin')
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- Create campaigns for Zenith Health (Healthcare)
INSERT INTO public.campaigns (
    name, 
    description, 
    brand_id, 
    start_date, 
    end_date, 
    status, 
    created_by
)
VALUES
    -- Past campaign
    (
        'Demo Zenith Wellness Series', 
        'Educational content series about wellness and preventative health',
        (SELECT id FROM public.brands WHERE name = 'Demo Zenith Health'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '10 months')::DATE, 
            (CURRENT_DATE - INTERVAL '9 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '7 months')::DATE, 
            (CURRENT_DATE - INTERVAL '6 months')::DATE
        ),
        'complete',
        demo_random_user('manager')
    ),
    
    -- Current campaign
    (
        'Demo Zenith Summer Health', 
        'Summer health tips and product promotion campaign',
        (SELECT id FROM public.brands WHERE name = 'Demo Zenith Health'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '1 month')::DATE, 
            CURRENT_DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '2 months')::DATE, 
            (CURRENT_DATE + INTERVAL '3 months')::DATE
        ),
        'active',
        demo_random_user('manager')
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- Create campaigns for EcoSolutions (Sustainability)
INSERT INTO public.campaigns (
    name, 
    description, 
    brand_id, 
    start_date, 
    end_date, 
    status, 
    created_by
)
VALUES
    -- Past campaign
    (
        'Demo Eco Earth Day Initiative', 
        'Special campaign focused on sustainability for Earth Day',
        (SELECT id FROM public.brands WHERE name = 'Demo EcoSolutions'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '11 months')::DATE, 
            (CURRENT_DATE - INTERVAL '10 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '9 months')::DATE, 
            (CURRENT_DATE - INTERVAL '8 months')::DATE
        ),
        'complete',
        demo_random_user('manager')
    ),
    
    -- Current campaign
    (
        'Demo Eco Plastic Reduction', 
        'Campaign to promote our plastic-free product alternatives',
        (SELECT id FROM public.brands WHERE name = 'Demo EcoSolutions'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '3 months')::DATE, 
            (CURRENT_DATE - INTERVAL '2 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '1 month')::DATE, 
            (CURRENT_DATE + INTERVAL '2 months')::DATE
        ),
        'active',
        demo_random_user('manager')
    ),
    
    -- Future campaign
    (
        'Demo Eco Holiday Sustainable Gifts', 
        'Holiday campaign focusing on sustainable gift options',
        (SELECT id FROM public.brands WHERE name = 'Demo EcoSolutions'),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '4 months')::DATE, 
            (CURRENT_DATE + INTERVAL '5 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '7 months')::DATE, 
            (CURRENT_DATE + INTERVAL '8 months')::DATE
        ),
        'draft',
        demo_random_user('manager')
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- Create campaigns for other brands
INSERT INTO public.campaigns (
    name, 
    description, 
    brand_id, 
    start_date, 
    end_date, 
    status, 
    created_by
)
VALUES
    -- Velocity Motors (Automotive)
    (
        'Demo Velocity Summer Performance', 
        'Summer campaign showcasing vehicle performance features',
        (SELECT id FROM public.brands WHERE name = 'Demo Velocity Motors'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '4 months')::DATE, 
            (CURRENT_DATE - INTERVAL '3 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '2 months')::DATE, 
            (CURRENT_DATE + INTERVAL '3 months')::DATE
        ),
        'active',
        demo_random_user('admin')
    ),
    
    -- Horizon Finance (Financial Services)
    (
        'Demo Horizon Retirement Planning', 
        'Educational campaign about retirement planning options',
        (SELECT id FROM public.brands WHERE name = 'Demo Horizon Finance'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '5 months')::DATE, 
            (CURRENT_DATE - INTERVAL '4 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '1 month')::DATE, 
            CURRENT_DATE
        ),
        'complete',
        demo_random_user('manager')
    ),
    
    -- Cosmic Beverages (Beverage)
    (
        'Demo Cosmic Summer Refresh', 
        'Summer promotional campaign for refreshing beverages',
        (SELECT id FROM public.brands WHERE name = 'Demo Cosmic Beverages'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '2 months')::DATE, 
            (CURRENT_DATE - INTERVAL '1 month')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '3 months')::DATE, 
            (CURRENT_DATE + INTERVAL '4 months')::DATE
        ),
        'active',
        demo_random_user('manager')
    ),
    
    -- Frontier Travel (Travel)
    (
        'Demo Frontier Destination Series', 
        'Campaign showcasing exotic travel destinations',
        (SELECT id FROM public.brands WHERE name = 'Demo Frontier Travel'),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '6 months')::DATE, 
            (CURRENT_DATE - INTERVAL '5 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE - INTERVAL '2 months')::DATE, 
            (CURRENT_DATE - INTERVAL '1 month')::DATE
        ),
        'complete',
        demo_random_user('admin')
    ),
    (
        'Demo Frontier Fall Getaways', 
        'Promotional campaign for fall travel packages',
        (SELECT id FROM public.brands WHERE name = 'Demo Frontier Travel'),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '1 month')::DATE, 
            (CURRENT_DATE + INTERVAL '2 months')::DATE
        ),
        demo_random_date(
            (CURRENT_DATE + INTERVAL '4 months')::DATE, 
            (CURRENT_DATE + INTERVAL '5 months')::DATE
        ),
        'draft',
        demo_random_user('admin')
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- Output campaign counts by status
DO $$
DECLARE
    draft_count INTEGER;
    active_count INTEGER;
    complete_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO draft_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'draft';
    SELECT COUNT(*) INTO active_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'active';
    SELECT COUNT(*) INTO complete_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'complete';
    SELECT COUNT(*) INTO total_count FROM public.campaigns WHERE name LIKE 'Demo%';
    
    RAISE NOTICE 'Demo campaigns created: % (% draft, % active, % complete)', 
        total_count, draft_count, active_count, complete_count;
END;
$$; 