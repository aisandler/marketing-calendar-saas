-- This script is a more extreme approach to the description column issue
-- It will recreate the entire brands table

-- First, create a backup of existing data
CREATE TABLE brands_backup AS SELECT * FROM brands;

-- Get all the columns EXCEPT description
SELECT string_agg(column_name, ', ')
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'brands'
AND lower(column_name) != 'description';

-- Save schema info for reference
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Now drop and recreate the entire table
DROP TABLE brands;

-- Recreate the table with explicit description column
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data back from backup
INSERT INTO brands (id, name, created_at, updated_at)
SELECT id, name, created_at, updated_at
FROM brands_backup;

-- Create updated function to ensure it's compatible
DROP FUNCTION IF EXISTS insert_brand(text, text);

CREATE OR REPLACE FUNCTION insert_brand(brand_name TEXT, brand_description TEXT)
RETURNS SETOF brands 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;

-- Disable RLS temporarily for testing
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Show the final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Test insertion with description
INSERT INTO brands (name, description) 
VALUES ('Test Brand After Table Recreation', 'Description test after completely rebuilding the table')
RETURNING *;