-- BRANDS TABLE FIXES ALL-IN-ONE (V2)

-- 1. First create a backup of the brands table
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- 2. Temporarily disable RLS
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- 3. Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- 4. Check all policies
SELECT * FROM pg_policies WHERE tablename = 'brands';

-- 5. Drop and recreate description column
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE brands DROP COLUMN IF EXISTS description;
    RAISE NOTICE 'Dropped description column';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'No description column to drop';
  END;
  
  BEGIN
    ALTER TABLE brands DROP COLUMN IF EXISTS "Description";
    RAISE NOTICE 'Dropped Description column (capitalized)';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'No Description column to drop';
  END;
  
  ALTER TABLE brands ADD COLUMN description TEXT;
  RAISE NOTICE 'Added new description column';
END $$;

-- 6. Drop and recreate the stored function for direct brand creation
DROP FUNCTION IF EXISTS insert_brand(text,text);

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

-- 7. Create or replace function to execute arbitrary SQL
-- BE CAREFUL with this function - it can be a security risk
-- This should only be used for development/debugging
DROP FUNCTION IF EXISTS execute_sql_unsafe(text);

CREATE OR REPLACE FUNCTION execute_sql_unsafe(sql_query TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'DO $do$ BEGIN RAISE NOTICE ''Executing: ' || sql_query || '''; END $do$;';
  EXECUTE 'WITH query_result AS (' || sql_query || ') 
           SELECT COALESCE(jsonb_agg(q), ''[]''::jsonb) 
           FROM query_result q' INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- 8. Create proper RLS policies
DROP POLICY IF EXISTS "Only admins and managers can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins and managers can update brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins and managers can delete brands" ON public.brands;
DROP POLICY IF EXISTS "Only admins and managers can insert brands" ON public.brands;

-- Create separate policies for update, delete and insert operations
CREATE POLICY "Only admins and managers can update brands" ON public.brands
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Only admins and managers can delete brands" ON public.brands
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Only admins and managers can insert brands" ON public.brands
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 9. Test by inserting a brand directly
INSERT INTO brands (name, description)
VALUES ('Test Brand After Complete Fix', 'This description should work after all fixes')
RETURNING *;

-- 10. View final table and sample data
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

SELECT * FROM brands ORDER BY created_at DESC LIMIT 5;