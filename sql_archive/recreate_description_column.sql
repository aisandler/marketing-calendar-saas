-- This is a more aggressive approach that tries to recreate the description column
-- by first saving existing data, then dropping and recreating the column

-- First, let's check the current schema
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Create a backup of brands data
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- Save current description data if it exists
DO $$
BEGIN
  -- Check if column exists before trying to save data
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND column_name = 'description'
  ) THEN
    -- Backup exists, so save the data in a temporary table
    CREATE TEMP TABLE brands_description_data AS 
    SELECT id, description FROM brands;
  ELSIF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND lower(column_name) = 'description'
    AND column_name <> 'description'
  ) THEN
    -- Column exists but with wrong case
    DECLARE
      wrong_case_column TEXT;
    BEGIN
      SELECT column_name INTO wrong_case_column 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'brands' 
      AND lower(column_name) = 'description'
      AND column_name <> 'description';
      
      -- Create dynamic SQL to select from the wrongly-cased column
      EXECUTE format('
        CREATE TEMP TABLE brands_description_data AS 
        SELECT id, "%s" as description FROM brands
      ', wrong_case_column);
    END;
  ELSE
    -- No description column exists, create an empty backup
    CREATE TEMP TABLE brands_description_data (
      id UUID,
      description TEXT
    );
  END IF;
END $$;

-- Now try to drop all description columns (any case)
DO $$
DECLARE
  col_record RECORD;
BEGIN
  FOR col_record IN 
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND lower(column_name) = 'description'
  LOOP
    EXECUTE format('ALTER TABLE brands DROP COLUMN IF EXISTS "%s"', col_record.column_name);
    RAISE NOTICE 'Dropped column: %', col_record.column_name;
  END LOOP;
END $$;

-- Add a proper description column
ALTER TABLE brands ADD COLUMN description TEXT;

-- Restore data from backup if it exists
UPDATE brands b
SET description = bd.description
FROM brands_description_data bd
WHERE b.id = bd.id
AND bd.description IS NOT NULL;

-- Check the schema after changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;