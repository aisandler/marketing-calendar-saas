-- Demo Data Generation: Initial Setup
-- This script prepares the database for demo data generation

-- Temporarily disable RLS to make bulk data insertion easier
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.briefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brief_history DISABLE ROW LEVEL SECURITY;

-- Clear existing demo data if needed (be careful with this in production!)
-- Uncomment these lines only if you want to start fresh
-- DELETE FROM public.brief_history;
-- DELETE FROM public.briefs;
-- DELETE FROM public.campaigns;
-- DELETE FROM public.brands WHERE name LIKE 'Demo%';
-- DELETE FROM public.resources WHERE name LIKE 'Demo%';
-- DELETE FROM public.teams WHERE name LIKE 'Demo%';
-- DELETE FROM public.users WHERE email LIKE '%demo%';

-- Create helper function for date generation with realistic patterns
CREATE OR REPLACE FUNCTION demo_random_date(start_date DATE, end_date DATE) 
RETURNS DATE AS $$
BEGIN
    RETURN start_date + (random() * (end_date - start_date))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Set variables for the date ranges
DO $$
BEGIN
    -- Create a 1-year demo period ending today
    PERFORM set_config('demo.start_date', (CURRENT_DATE - INTERVAL '1 year')::TEXT, FALSE);
    PERFORM set_config('demo.end_date', CURRENT_DATE::TEXT, FALSE);
    
    -- Add 3 months into the future for planned work
    PERFORM set_config('demo.future_date', (CURRENT_DATE + INTERVAL '3 months')::TEXT, FALSE);
    
    -- Output the configuration
    RAISE NOTICE 'Demo period: % to % (Future: %)', 
        current_setting('demo.start_date'), 
        current_setting('demo.end_date'),
        current_setting('demo.future_date');
END;
$$; 