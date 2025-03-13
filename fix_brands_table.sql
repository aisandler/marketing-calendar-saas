-- First check if the brands table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'brands'
);

-- Check for column case sensitivity issues
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'brands'
AND lower(column_name) = 'description';

-- Try to add the description column if it doesn't exist
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS description TEXT;

-- If the column exists but with wrong case, create a new column and migrate the data
-- DO $$ 
-- DECLARE
--   column_exists BOOLEAN;
--   wrong_case_column TEXT;
-- BEGIN
--   -- Check if any version of 'description' column exists (regardless of case)
--   SELECT column_name INTO wrong_case_column
--   FROM information_schema.columns 
--   WHERE table_schema = 'public' 
--   AND table_name = 'brands'
--   AND lower(column_name) = 'description'
--   AND column_name != 'description'
--   LIMIT 1;
--   
--   IF wrong_case_column IS NOT NULL THEN
--     -- Column exists with wrong case, so rename it
--     EXECUTE format('ALTER TABLE public.brands RENAME COLUMN "%s" TO description', wrong_case_column);
--     RAISE NOTICE 'Renamed column from % to description', wrong_case_column;
--   ELSE
--     -- No description column found, try to add it
--     BEGIN
--       ALTER TABLE public.brands ADD COLUMN description TEXT;
--       RAISE NOTICE 'Added description column';
--     EXCEPTION WHEN duplicate_column THEN
--       RAISE NOTICE 'description column already exists';
--     END;
--   END IF;
-- END $$;

-- Fix brands table by adding the description column

-- Check if description column exists in brands table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'brands' AND column_name = 'description'
    ) THEN
        -- Add description column if it doesn't exist
        ALTER TABLE brands ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to brands table';
    END IF;
END $$;

-- Ensure the updated_at trigger is working for brands
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default brand if none exists
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for marketing calendar', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);