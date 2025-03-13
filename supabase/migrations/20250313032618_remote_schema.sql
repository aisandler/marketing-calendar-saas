drop policy "Only admins and managers can manage brands" on "public"."brands";

create table "public"."brands_backup" (
    "id" uuid,
    "name" text,
    "description" text,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."brands" add column "description2" text;

alter table "public"."brands" disable row level security;

alter table "public"."resources" alter column "hourly_rate" drop default;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.execute_sql(sql_string text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.execute_sql_unsafe(sql_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_column_info(table_name text)
 RETURNS SETOF json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_policies_info(table_name text)
 RETURNS SETOF json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_table_info(table_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.insert_brand(brand_name text, brand_description text)
 RETURNS SETOF brands
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_brand_with_description2(brand_name text, brand_description text)
 RETURNS SETOF brands
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description2)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$function$
;

grant delete on table "public"."brands_backup" to "anon";

grant insert on table "public"."brands_backup" to "anon";

grant references on table "public"."brands_backup" to "anon";

grant select on table "public"."brands_backup" to "anon";

grant trigger on table "public"."brands_backup" to "anon";

grant truncate on table "public"."brands_backup" to "anon";

grant update on table "public"."brands_backup" to "anon";

grant delete on table "public"."brands_backup" to "authenticated";

grant insert on table "public"."brands_backup" to "authenticated";

grant references on table "public"."brands_backup" to "authenticated";

grant select on table "public"."brands_backup" to "authenticated";

grant trigger on table "public"."brands_backup" to "authenticated";

grant truncate on table "public"."brands_backup" to "authenticated";

grant update on table "public"."brands_backup" to "authenticated";

grant delete on table "public"."brands_backup" to "service_role";

grant insert on table "public"."brands_backup" to "service_role";

grant references on table "public"."brands_backup" to "service_role";

grant select on table "public"."brands_backup" to "service_role";

grant trigger on table "public"."brands_backup" to "service_role";

grant truncate on table "public"."brands_backup" to "service_role";

grant update on table "public"."brands_backup" to "service_role";

create policy "Only admins and managers can delete brands"
on "public"."brands"
as permissive
for delete
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])))))));


create policy "Only admins and managers can insert brands"
on "public"."brands"
as permissive
for insert
to public
with check (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])))))));


create policy "Only admins and managers can update brands"
on "public"."brands"
as permissive
for update
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])))))));


CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


