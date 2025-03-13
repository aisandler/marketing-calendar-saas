-- This script uses CASCADE to drop and recreate the brands table
-- WARNING: This will also drop dependent objects and recreate them

-- First, drop the old backup if it exists and create a new one
DROP TABLE IF EXISTS brands_backup;
CREATE TABLE brands_backup AS SELECT * FROM brands;

-- Save foreign key relationships info for recreation
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND
    (ccu.table_name = 'brands' OR tc.table_name = 'brands');

-- Save dependencies for reference
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view,
    source_ns.nspname as source_schema,
    source_table.relname as source_table
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'brands'
AND dependent_view.relname != source_table.relname;

-- Save RLS policies
SELECT 
    policyname, 
    tablename, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename = 'brands';

-- Now drop the table with CASCADE to remove dependencies
DROP TABLE brands CASCADE;

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

-- Recreate foreign key constraints for campaigns table
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Recreate foreign key constraints for briefs table
ALTER TABLE briefs 
ADD CONSTRAINT briefs_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES brands(id);

-- Disable RLS temporarily for testing
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "Users can view all brands" ON public.brands
    FOR SELECT USING (true);

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

-- Create the updated_at trigger
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Show the final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Test insertion with description
INSERT INTO brands (name, description) 
VALUES ('Test Brand After Table Recreation', 'Description test after completely rebuilding the table')
RETURNING *;