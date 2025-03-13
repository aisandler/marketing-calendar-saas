-- Create a function to debug briefs table columns
CREATE OR REPLACE FUNCTION public.debug_briefs_columns()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN ARRAY(
        SELECT column_name::text
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'briefs'
        ORDER BY ordinal_position
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_briefs_columns() TO authenticated;

-- Create a function to debug briefs table data
CREATE OR REPLACE FUNCTION public.debug_briefs_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'table_exists', EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'briefs'
        ),
        'row_count', (SELECT COUNT(*) FROM briefs),
        'columns', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', column_name,
                    'type', data_type,
                    'nullable', is_nullable
                )
            )
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'briefs'
        ),
        'sample_data', (
            SELECT jsonb_agg(row_to_json(b))
            FROM (SELECT * FROM briefs LIMIT 1) b
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_briefs_data() TO authenticated; 