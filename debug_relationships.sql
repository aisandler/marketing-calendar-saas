-- Diagnostic script to examine foreign key relationships and data types

-- Check table structures
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name IN ('brands', 'briefs', 'campaigns')
ORDER BY table_name, ordinal_position;

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    pg_get_constraintdef(con.oid) AS constraint_def
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    JOIN pg_constraint AS con
        ON con.conname = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name IN ('brands', 'briefs', 'campaigns')
         OR ccu.table_name IN ('brands', 'briefs', 'campaigns'));

-- Check sample data
SELECT id, name, created_at FROM brands LIMIT 5;
SELECT id, title, brand_id FROM briefs LIMIT 5;
SELECT id, name, brand_id FROM campaigns LIMIT 5;

-- Check if any briefs or campaigns reference brands that don't exist
SELECT b.id, b.title, b.brand_id, br.name AS brand_name
FROM briefs b
LEFT JOIN brands br ON b.brand_id = br.id
WHERE br.id IS NULL AND b.brand_id IS NOT NULL
LIMIT 10;

SELECT c.id, c.name, c.brand_id, br.name AS brand_name
FROM campaigns c
LEFT JOIN brands br ON c.brand_id = br.id
WHERE br.id IS NULL AND c.brand_id IS NOT NULL
LIMIT 10;

-- Function to fix UUID equality issues
CREATE OR REPLACE FUNCTION uuid_eq_text(uuid, text) RETURNS boolean AS $$
BEGIN
    RETURN $1 = $2::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STRICT IMMUTABLE;

CREATE OR REPLACE FUNCTION uuid_eq_text(text, uuid) RETURNS boolean AS $$
BEGIN
    RETURN $1::uuid = $2;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STRICT IMMUTABLE;

-- Fix brands deletion function
CREATE OR REPLACE FUNCTION safe_delete_brand(brand_uuid text)
RETURNS SETOF brands 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    brand_id_uuid UUID;
BEGIN
    -- Convert to UUID (validates it's a proper UUID)
    BEGIN
        brand_id_uuid := brand_uuid::UUID;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid UUID: %', brand_uuid;
    END;

    -- Check for briefs using this brand
    IF EXISTS (SELECT 1 FROM briefs WHERE brand_id = brand_id_uuid LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot delete brand - it is used in one or more briefs';
    END IF;
    
    -- Check for campaigns using this brand
    IF EXISTS (SELECT 1 FROM campaigns WHERE brand_id = brand_id_uuid LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot delete brand - it is used in one or more campaigns';
    END IF;
    
    -- Delete the brand and return the deleted row
    RETURN QUERY
    DELETE FROM brands 
    WHERE id = brand_id_uuid
    RETURNING *;
END;
$$;