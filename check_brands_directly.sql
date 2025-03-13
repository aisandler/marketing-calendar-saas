-- Get raw table structure to see the actual columns
SELECT * FROM pg_attribute 
WHERE attrelid = 'brands'::regclass 
AND attnum > 0 
AND NOT attisdropped
ORDER BY attnum;

-- Get column names with their data types in raw form
SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_catalog.pg_attribute a
WHERE a.attnum > 0
AND NOT a.attisdropped
AND a.attrelid = (
    SELECT c.oid
    FROM pg_catalog.pg_class c
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'brands'
    AND n.nspname = 'public'
);

-- Try to update an existing brand with description directly
-- Replace [BRAND_ID] with an actual brand ID from your database
-- UPDATE brands SET description = 'Test description' WHERE id = '[BRAND_ID]';

-- Or create a new brand with description using SQL
-- INSERT INTO brands (name, description) VALUES ('Test Brand Direct', 'Test description direct');

-- Create diagnostic table to debug column issues
CREATE TABLE IF NOT EXISTS debug_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Try to insert into diagnostic table
INSERT INTO debug_brands (name, description) 
VALUES ('Test Debug Brand', 'Test debug description');

-- Check if insert worked
SELECT * FROM debug_brands ORDER BY created_at DESC LIMIT 5;