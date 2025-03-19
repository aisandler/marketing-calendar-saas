-- First, let's examine the details of the brands table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands';

-- Check if any 'description' column exists (case insensitive)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'brands'
AND lower(column_name) = 'description';

-- If the description column doesn't exist, add it
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.brands ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  EXCEPTION 
    WHEN duplicate_column THEN
      RAISE NOTICE 'description column already exists';
  END;
END $$;

-- If a description column exists with wrong case, rename it
DO $$ 
DECLARE
  wrong_case_column TEXT;
BEGIN
  SELECT column_name INTO wrong_case_column
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'brands'
  AND lower(column_name) = 'description'
  AND column_name != 'description'
  LIMIT 1;
  
  IF wrong_case_column IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.brands RENAME COLUMN "%s" TO description', wrong_case_column);
    RAISE NOTICE 'Renamed column from % to description', wrong_case_column;
  END IF;
END $$;

-- Check the table structure after changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands';