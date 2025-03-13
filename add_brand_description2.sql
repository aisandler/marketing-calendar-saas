-- This approach adds a new description column called description2
-- rather than trying to replace the existing one

-- First, check what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Add a new description column with a different name
ALTER TABLE brands ADD COLUMN IF NOT EXISTS description2 TEXT;

-- Add a function that specifically uses the new column
CREATE OR REPLACE FUNCTION insert_brand_with_description2(brand_name TEXT, brand_description TEXT)
RETURNS SETOF brands 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description2)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;

-- Update the BrandsManagement component to display and use description2
-- (You'll need to modify the component code to use description2)

-- Test the new column
INSERT INTO brands (name, description2)
VALUES ('Test Brand with description2', 'This is using the new description2 column')
RETURNING *;