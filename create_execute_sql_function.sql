-- Create the execute_sql_unsafe function that allows executing arbitrary SQL
-- CAUTION: This is for development/debugging purposes only

CREATE OR REPLACE FUNCTION execute_sql_unsafe(sql_query TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Log the executed SQL for debugging (visible in Supabase logs)
  RAISE NOTICE 'Executing SQL: %', sql_query;
  
  -- Execute the SQL and capture results as JSON
  EXECUTE 'WITH query_result AS (' || sql_query || ') 
           SELECT COALESCE(jsonb_agg(q), ''[]''::jsonb) 
           FROM query_result q' INTO result;
  
  -- Return the result
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error information if something goes wrong
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'state', SQLSTATE,
    'query', sql_query
  );
END;
$$;