-- Check the actual schema of the brands table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brands'
ORDER BY ordinal_position;

-- Check for case sensitivity issues
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brands' AND 
      (lower(column_name) = 'description' OR column_name = 'description')
ORDER BY ordinal_position;

-- Check if table exists at all
SELECT tablename 
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND tablename = 'brands';

-- Check policy setup
SELECT * 
FROM pg_policies 
WHERE tablename = 'brands';

-- Attempt to fix by recreating the column with the right case
-- This is commented out to prevent accidental execution
-- ALTER TABLE brands 
--   ADD COLUMN IF NOT EXISTS description TEXT;

-- Alternatively, if the column exists but with different case:
-- ALTER TABLE brands RENAME COLUMN "Description" TO description;