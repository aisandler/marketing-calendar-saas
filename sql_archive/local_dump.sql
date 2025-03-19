

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."brief_status" AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'in_progress',
    'review',
    'complete',
    'cancelled'
);


ALTER TYPE "public"."brief_status" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'draft',
    'active',
    'complete',
    'cancelled'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."resource_type" AS ENUM (
    'internal',
    'agency',
    'freelancer'
);


ALTER TYPE "public"."resource_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'manager',
    'contributor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_briefs_columns"() RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."debug_briefs_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_briefs_data"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."debug_briefs_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql_string" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."execute_sql"("sql_string" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql_unsafe"("sql_query" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."execute_sql_unsafe"("sql_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_column_info"("table_name" "text") RETURNS SETOF "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."get_column_info"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_policies_info"("table_name" "text") RETURNS SETOF "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."get_policies_info"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_info"("table_name" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."get_table_info"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_brief_history"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.brief_history (
            brief_id,
            changed_by,
            previous_state,
            new_state
        ) VALUES (
            NEW.id,
            auth.uid(),
            row_to_json(OLD),
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_brief_history"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "description2" "text"
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_brand"("brand_name" "text", "brand_description" "text") RETURNS SETOF "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;


ALTER FUNCTION "public"."insert_brand"("brand_name" "text", "brand_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_brand_with_description2"("brand_name" "text", "brand_description" "text") RETURNS SETOF "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description2)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;


ALTER FUNCTION "public"."insert_brand_with_description2"("brand_name" "text", "brand_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands_backup" (
    "id" "uuid",
    "name" "text",
    "description" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."brands_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brief_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "brief_id" "uuid" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "previous_state" "jsonb" NOT NULL,
    "new_state" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."brief_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."briefs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "campaign_id" "uuid",
    "brand_id" "uuid" NOT NULL,
    "resource_id" "uuid",
    "start_date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "estimated_hours" numeric,
    "status" "public"."brief_status" DEFAULT 'draft'::"public"."brief_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level" NOT NULL,
    "channel" "text" NOT NULL,
    "specifications" "jsonb",
    "created_by" "uuid" NOT NULL,
    "approver_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expenses" numeric DEFAULT 0,
    CONSTRAINT "valid_brief_dates" CHECK (("due_date" >= "start_date"))
);


ALTER TABLE "public"."briefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "brand_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."campaign_status" DEFAULT 'draft'::"public"."campaign_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_campaign_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."resource_type" NOT NULL,
    "capacity_hours" numeric DEFAULT 40,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hourly_rate" numeric,
    "media_type" "text",
    "team_id" "uuid"
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'contributor'::"public"."user_role" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brief_history"
    ADD CONSTRAINT "brief_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_brief_history_brief_id" ON "public"."brief_history" USING "btree" ("brief_id");



CREATE INDEX "idx_briefs_approver_id" ON "public"."briefs" USING "btree" ("approver_id");



CREATE INDEX "idx_briefs_brand_id" ON "public"."briefs" USING "btree" ("brand_id");



CREATE INDEX "idx_briefs_campaign_id" ON "public"."briefs" USING "btree" ("campaign_id");



CREATE INDEX "idx_briefs_created_by" ON "public"."briefs" USING "btree" ("created_by");



CREATE INDEX "idx_briefs_due_date" ON "public"."briefs" USING "btree" ("due_date");



CREATE INDEX "idx_briefs_resource_id" ON "public"."briefs" USING "btree" ("resource_id");



CREATE INDEX "idx_briefs_status" ON "public"."briefs" USING "btree" ("status");



CREATE INDEX "idx_campaigns_brand_id" ON "public"."campaigns" USING "btree" ("brand_id");



CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "idx_resources_team_id" ON "public"."resources" USING "btree" ("team_id");



CREATE OR REPLACE TRIGGER "brief_history_trigger" AFTER UPDATE ON "public"."briefs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_brief_history"();



CREATE OR REPLACE TRIGGER "update_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_briefs_updated_at" BEFORE UPDATE ON "public"."briefs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resources_updated_at" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."brief_history"
    ADD CONSTRAINT "brief_history_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "public"."briefs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brief_history"
    ADD CONSTRAINT "brief_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."briefs"
    ADD CONSTRAINT "briefs_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



CREATE POLICY "Admins can manage all profiles" ON "public"."users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "users_1"
  WHERE (("auth"."uid"() = "users_1"."id") AND (("users_1"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Admins can view all profiles" ON "public"."users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Authenticated users can create briefs" ON "public"."briefs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create campaigns" ON "public"."campaigns" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert brief history" ON "public"."brief_history" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Briefs are deletable by admins, managers, and creators" ON "public"."briefs" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))))));



CREATE POLICY "Briefs are insertable by authenticated users" ON "public"."briefs" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Briefs are updatable by admins, managers, and creators" ON "public"."briefs" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))) OR ("auth"."uid"() = "approver_id")))) WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."uid"() = "created_by") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))) OR ("auth"."uid"() = "approver_id"))));



CREATE POLICY "Briefs are viewable by all users" ON "public"."briefs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Only admins and managers can delete brands" ON "public"."brands" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Only admins and managers can insert brands" ON "public"."brands" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Only admins and managers can manage resources" ON "public"."resources" USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Only admins and managers can update brands" ON "public"."brands" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Only admins can insert users" ON "public"."users" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "Only admins can update users" ON "public"."users" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"public"."user_role")))))));



CREATE POLICY "Public read access" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Teams are deletable by admins and managers" ON "public"."teams" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])));



CREATE POLICY "Teams are insertable by admins and managers" ON "public"."teams" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])));



CREATE POLICY "Teams are updatable by admins and managers" ON "public"."teams" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'manager'::"text"])));



CREATE POLICY "Teams are viewable by all users" ON "public"."teams" FOR SELECT USING (true);



CREATE POLICY "Users can manage their own profile" ON "public"."users" TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update briefs they created or if admin/manager" ON "public"."briefs" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))))));



CREATE POLICY "Users can update campaigns they created or if admin/manager" ON "public"."campaigns" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view all brands" ON "public"."brands" FOR SELECT USING (true);



CREATE POLICY "Users can view all briefs" ON "public"."briefs" FOR SELECT USING (true);



CREATE POLICY "Users can view all campaigns" ON "public"."campaigns" FOR SELECT USING (true);



CREATE POLICY "Users can view all resources" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "Users can view all users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view brief history" ON "public"."brief_history" FOR SELECT USING (true);



ALTER TABLE "public"."brief_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."briefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."debug_briefs_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_briefs_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_briefs_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_briefs_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_briefs_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_briefs_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("sql_string" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_string" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql_string" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql_unsafe"("sql_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql_unsafe"("sql_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql_unsafe"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_column_info"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_column_info"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_column_info"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_policies_info"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_policies_info"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_policies_info"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_info"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_info"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_info"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_brief_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_brief_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_brief_history"() TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_brand"("brand_name" "text", "brand_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_brand"("brand_name" "text", "brand_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_brand"("brand_name" "text", "brand_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_brand_with_description2"("brand_name" "text", "brand_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_brand_with_description2"("brand_name" "text", "brand_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_brand_with_description2"("brand_name" "text", "brand_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."brands_backup" TO "anon";
GRANT ALL ON TABLE "public"."brands_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."brands_backup" TO "service_role";



GRANT ALL ON TABLE "public"."brief_history" TO "anon";
GRANT ALL ON TABLE "public"."brief_history" TO "authenticated";
GRANT ALL ON TABLE "public"."brief_history" TO "service_role";



GRANT ALL ON TABLE "public"."briefs" TO "anon";
GRANT ALL ON TABLE "public"."briefs" TO "authenticated";
GRANT ALL ON TABLE "public"."briefs" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
