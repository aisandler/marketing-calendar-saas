-- Demo Data Generation: Campaigns
-- This script creates demo campaigns for each brand

-- Helper function to get random user ID
CREATE OR REPLACE FUNCTION demo_random_user(role_type TEXT DEFAULT NULL) 
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    IF role_type IS NULL THEN
        SELECT id INTO user_id FROM auth.users 
        WHERE email LIKE '%.demo@example.com'
        ORDER BY random() LIMIT 1;
    ELSE
        SELECT id INTO user_id FROM auth.users 
        WHERE email LIKE '%.demo@example.com' AND raw_user_meta_data->>'role' = role_type
        ORDER BY random() LIMIT 1;
    END IF;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create campaign dates
CREATE OR REPLACE FUNCTION demo_campaign_dates(
    campaign_type TEXT,
    base_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    start_date DATE,
    end_date DATE,
    status campaign_status
) AS $$
DECLARE
    past_start DATE;
    past_end DATE;
    current_start DATE;
    current_end DATE;
    future_start DATE;
    future_end DATE;
    rand_days INTEGER;
BEGIN
    -- Variables for past campaigns
    rand_days := floor(random() * 90)::INTEGER + 90; -- 3-6 months ago
    past_start := base_date - (rand_days * INTERVAL '1 day');
    past_end := past_start + ((floor(random() * 60)::INTEGER + 30) * INTERVAL '1 day'); -- 1-3 month duration
    
    -- Variables for current campaigns
    rand_days := floor(random() * 30)::INTEGER + 15; -- 0.5-1.5 months ago
    current_start := base_date - (rand_days * INTERVAL '1 day');
    current_end := base_date + ((floor(random() * 45)::INTEGER + 15) * INTERVAL '1 day'); -- 0.5-2 months from now
    
    -- Variables for future campaigns
    rand_days := floor(random() * 30)::INTEGER + 15; -- 0.5-1.5 months from now
    future_start := base_date + (rand_days * INTERVAL '1 day');
    future_end := future_start + ((floor(random() * 90)::INTEGER + 30) * INTERVAL '1 day'); -- 1-4 month duration
    
    -- Return appropriate dates based on campaign type
    IF campaign_type = 'past' THEN
        start_date := past_start;
        end_date := past_end;
        status := 'complete';
    ELSIF campaign_type = 'current' THEN
        start_date := current_start;
        end_date := current_end;
        status := 'active';
    ELSIF campaign_type = 'future' THEN
        start_date := future_start;
        end_date := future_end;
        status := 'draft';
    ELSE
        -- Default to current if invalid type
        start_date := current_start;
        end_date := current_end;
        status := 'active';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Tech brand campaigns
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
WITH campaign_data AS (
    -- Past campaigns
    SELECT 
        'Demo Product Launch: Quantum Smartphone' as name,
        'Launch campaign for our flagship smartphone with quantum computing capabilities' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations') as brand_id,
        *
    FROM demo_campaign_dates('past')
    UNION ALL
    SELECT 
        'Demo Holiday Tech Bundle' as name,
        'Special bundle offers across our product line for the holiday season' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations') as brand_id,
        *
    FROM demo_campaign_dates('past')
    UNION ALL
    -- Current campaigns
    SELECT 
        'Demo AI Integration Rollout' as name,
        'Marketing campaign for new AI features across our software products' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations') as brand_id,
        *
    FROM demo_campaign_dates('current')
    UNION ALL
    -- Future campaigns
    SELECT 
        'Demo Back to School Tech Essentials' as name,
        'Targeting students with educational discounts and essential tech packages' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations') as brand_id,
        *
    FROM demo_campaign_dates('future')
    UNION ALL
    SELECT 
        'Demo 10th Anniversary Technology Showcase' as name,
        'Special event and product releases celebrating our 10th year of innovation' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations') as brand_id,
        *
    FROM demo_campaign_dates('future')
)
SELECT 
    name, 
    description,
    brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'admin.demo@example.com')
FROM campaign_data;

-- Health brand campaigns
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
WITH campaign_data AS (
    -- Past campaigns
    SELECT 
        'Demo Organic Product Line Expansion' as name,
        'Launch of new certified organic product line with 30 new SKUs' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Healthy Living') as brand_id,
        *
    FROM demo_campaign_dates('past')
    UNION ALL
    -- Current campaigns
    SELECT 
        'Demo Summer Fitness Challenge' as name,
        'Social media campaign engaging customers in 60-day fitness challenges' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Healthy Living') as brand_id,
        *
    FROM demo_campaign_dates('current')
    UNION ALL
    SELECT 
        'Demo Wellness Webinar Series' as name,
        'Educational content marketing featuring health experts and nutritionists' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Healthy Living') as brand_id,
        *
    FROM demo_campaign_dates('current')
    UNION ALL
    -- Future campaigns
    SELECT 
        'Demo Plant-Based Protein Revolution' as name,
        'Launch campaign for new plant-based protein product line' as description,
        (SELECT id FROM public.brands WHERE name = 'Demo Healthy Living') as brand_id,
        *
    FROM demo_campaign_dates('future')
)
SELECT 
    name, 
    description,
    brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'cmo.demo@example.com')
FROM campaign_data;

-- Create campaigns for the remaining brands
-- Insert at least 1 past, 1 current, and 1 future campaign for each of the remaining brands
-- Fashion brand
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
SELECT 
    'Demo Fall Collection Launch' as name,
    'Introducing our exclusive designer fall collection with premium materials' as description,
    (SELECT id FROM public.brands WHERE name = 'Demo Luxury Fashion') as brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'manager1.demo@example.com')
FROM demo_campaign_dates('current');

-- Home brand
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
SELECT 
    'Demo Home Office Solutions' as name,
    'Showcasing our ergonomic and stylish home office furniture and accessories' as description,
    (SELECT id FROM public.brands WHERE name = 'Demo Urban Dwellings') as brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'manager2.demo@example.com')
FROM demo_campaign_dates('future');

-- Outdoor brand
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
SELECT 
    'Demo Winter Expedition Ready' as name,
    'Promotional campaign for our winter expedition gear and cold-weather essentials' as description,
    (SELECT id FROM public.brands WHERE name = 'Demo Adventure Gear') as brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'manager3.demo@example.com')
FROM demo_campaign_dates('past');

-- Food brand
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
SELECT 
    'Demo Gourmet Cooking Masterclass Series' as name,
    'Online cooking classes featuring celebrity chefs using our premium ingredients' as description,
    (SELECT id FROM public.brands WHERE name = 'Demo Culinary Delights') as brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'manager4.demo@example.com')
FROM demo_campaign_dates('current');

-- Finance brand
INSERT INTO public.campaigns (name, description, brand_id, status, start_date, end_date, created_by)
SELECT 
    'Demo Investment Account Promotion' as name,
    'Special offers for new investment accounts with reduced fees and premium benefits' as description,
    (SELECT id FROM public.brands WHERE name = 'Demo Financial Services') as brand_id,
    status,
    start_date,
    end_date,
    (SELECT id FROM public.users WHERE email = 'manager5.demo@example.com')
FROM demo_campaign_dates('future');

-- Output campaign counts by status
DO $$
DECLARE
    total_count INTEGER;
    draft_count INTEGER;
    active_count INTEGER;
    complete_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.campaigns WHERE name LIKE 'Demo%';
    SELECT COUNT(*) INTO draft_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'draft';
    SELECT COUNT(*) INTO active_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'active';
    SELECT COUNT(*) INTO complete_count FROM public.campaigns WHERE name LIKE 'Demo%' AND status = 'complete';
    
    RAISE NOTICE 'Demo campaigns created: % (% draft, % active, % complete)', 
        total_count, draft_count, active_count, complete_count;
END;
$$; 