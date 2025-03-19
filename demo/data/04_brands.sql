-- Demo Data Generation: Brands
-- This script creates a set of demo brands

-- Create brands with different focuses
INSERT INTO public.brands (name, description)
VALUES
    ('Demo Acme Corp', 'A multinational technology company focusing on consumer electronics, software, and online services.'),
    ('Demo Zenith Health', 'A healthcare company providing innovative medical solutions and wellness products.'),
    ('Demo EcoSolutions', 'An environmentally-conscious company creating sustainable products for everyday use.'),
    ('Demo Velocity Motors', 'A premium automotive brand known for performance, innovation, and luxury.'),
    ('Demo Horizon Finance', 'A financial services company offering banking, investment, and insurance solutions.'),
    ('Demo Cosmic Beverages', 'A beverage company with a diverse portfolio of refreshing and energizing drinks.'),
    ('Demo Frontier Travel', 'A travel and hospitality company providing unique experiences around the world.')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;

-- Store brand IDs for reference
DO $$
DECLARE
    acme_id UUID;
    zenith_id UUID;
    eco_id UUID;
    velocity_id UUID;
    horizon_id UUID;
    cosmic_id UUID;
    frontier_id UUID;
BEGIN
    SELECT id INTO acme_id FROM public.brands WHERE name = 'Demo Acme Corp';
    SELECT id INTO zenith_id FROM public.brands WHERE name = 'Demo Zenith Health';
    SELECT id INTO eco_id FROM public.brands WHERE name = 'Demo EcoSolutions';
    SELECT id INTO velocity_id FROM public.brands WHERE name = 'Demo Velocity Motors';
    SELECT id INTO horizon_id FROM public.brands WHERE name = 'Demo Horizon Finance';
    SELECT id INTO cosmic_id FROM public.brands WHERE name = 'Demo Cosmic Beverages';
    SELECT id INTO frontier_id FROM public.brands WHERE name = 'Demo Frontier Travel';
    
    -- Store for later use
    PERFORM set_config('demo.acme_id', acme_id::TEXT, FALSE);
    PERFORM set_config('demo.zenith_id', zenith_id::TEXT, FALSE);
    PERFORM set_config('demo.eco_id', eco_id::TEXT, FALSE);
    PERFORM set_config('demo.velocity_id', velocity_id::TEXT, FALSE);
    PERFORM set_config('demo.horizon_id', horizon_id::TEXT, FALSE);
    PERFORM set_config('demo.cosmic_id', cosmic_id::TEXT, FALSE);
    PERFORM set_config('demo.frontier_id', frontier_id::TEXT, FALSE);
    
    RAISE NOTICE 'Brand IDs stored for reference';
END;
$$;

-- Output brand count
DO $$
DECLARE
    brand_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO brand_count FROM public.brands WHERE name LIKE 'Demo%';
    RAISE NOTICE 'Demo brands created: %', brand_count;
END;
$$; 