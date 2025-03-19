-- Demo Data Generation: Brands
-- This script creates demo brands

-- Create demo brands
INSERT INTO public.brands (name, description)
VALUES
    ('Demo Tech Innovations', 'A cutting-edge technology company focused on consumer electronics and software'),
    ('Demo Healthy Living', 'Health and wellness brand offering organic food and fitness products'),
    ('Demo Luxury Fashion', 'High-end fashion retailer specializing in luxury apparel and accessories'),
    ('Demo Urban Dwellings', 'Modern furniture and home décor for urban living spaces'),
    ('Demo Adventure Gear', 'Outdoor equipment and apparel for adventure enthusiasts'),
    ('Demo Culinary Delights', 'Premium food and beverage products for gourmet cooking'),
    ('Demo Financial Services', 'Banking and financial services for individual and business needs');

-- Store brand IDs for reference
DO $$
DECLARE
    tech_brand_id UUID;
    health_brand_id UUID;
    fashion_brand_id UUID;
    home_brand_id UUID;
    outdoor_brand_id UUID;
    food_brand_id UUID;
    finance_brand_id UUID;
BEGIN
    SELECT id INTO tech_brand_id FROM public.brands WHERE name = 'Demo Tech Innovations';
    SELECT id INTO health_brand_id FROM public.brands WHERE name = 'Demo Healthy Living';
    SELECT id INTO fashion_brand_id FROM public.brands WHERE name = 'Demo Luxury Fashion';
    SELECT id INTO home_brand_id FROM public.brands WHERE name = 'Demo Urban Dwellings';
    SELECT id INTO outdoor_brand_id FROM public.brands WHERE name = 'Demo Adventure Gear';
    SELECT id INTO food_brand_id FROM public.brands WHERE name = 'Demo Culinary Delights';
    SELECT id INTO finance_brand_id FROM public.brands WHERE name = 'Demo Financial Services';
    
    -- Store for later use
    PERFORM set_config('demo.tech_brand_id', tech_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.health_brand_id', health_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.fashion_brand_id', fashion_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.home_brand_id', home_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.outdoor_brand_id', outdoor_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.food_brand_id', food_brand_id::TEXT, FALSE);
    PERFORM set_config('demo.finance_brand_id', finance_brand_id::TEXT, FALSE);
    
    RAISE NOTICE 'Brand IDs stored for reference';
END;
$$;

-- Output brand counts
DO $$
DECLARE
    brand_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO brand_count FROM public.brands WHERE name LIKE 'Demo%';
    RAISE NOTICE 'Demo brands created: %', brand_count;
END;
$$; 