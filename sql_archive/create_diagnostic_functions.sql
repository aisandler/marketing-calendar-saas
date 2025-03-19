-- Create function to get table information
CREATE OR REPLACE FUNCTION get_table_info(table_name TEXT)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'table_name', t.table_name,
    'table_schema', t.table_schema,
    'table_owner', t.table_owner,
    'table_type', t.table_type,
    'is_insertable_into', t.is_insertable_into,
    'is_rls_enabled', obj_description(
      (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass::oid, 
      'pg_class'
    )
  )
  INTO result
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_name = table_name;
  
  RETURN result;
END;
$$;

-- Create function to get column information
CREATE OR REPLACE FUNCTION get_column_info(table_name TEXT)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'column_name', c.column_name,
    'data_type', c.data_type,
    'character_maximum_length', c.character_maximum_length,
    'is_nullable', c.is_nullable,
    'column_default', c.column_default,
    'ordinal_position', c.ordinal_position
  )
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Create function to get policy information
CREATE OR REPLACE FUNCTION get_policies_info(table_name TEXT)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'policy_name', p.policyname,
    'command', p.cmd,
    'roles', p.roles,
    'using_expr', p.qual,
    'with_check', p.with_check
  )
  FROM pg_policies p
  WHERE p.tablename = table_name
  ORDER BY p.policyname;
END;
$$;

-- Create function to execute arbitrary SQL
-- BE CAREFUL with this function - it can be a security risk
-- This should only be used for development/debugging
CREATE OR REPLACE FUNCTION execute_sql(sql_string TEXT)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result_json json;
BEGIN
  -- Execute the SQL and get the result as JSON
  EXECUTE 'WITH result AS (' || sql_string || ') SELECT COALESCE(json_agg(r), ''[]''::json) FROM result r' INTO result_json;
  
  -- Return the result
  RETURN result_json;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'error', SQLERRM,
    'state', SQLSTATE,
    'context', format('Error executing SQL: %s', sql_string)
  );
END;
$$;