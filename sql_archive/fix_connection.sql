-- Check active connections and their state
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE usename != 'postgres'
ORDER BY query_start DESC;

-- Kill any stale connections (uncomment if needed)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE usename != 'postgres' 
-- AND state = 'idle';

-- Verify table access permissions again
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('users', 'resources')
ORDER BY table_name, grantee;

-- Check if any tables are locked
SELECT relation::regclass, * 
FROM pg_locks l 
JOIN pg_stat_activity s 
ON l.pid = s.pid 
WHERE relation IS NOT NULL;

-- Reset connection limits for roles
ALTER ROLE authenticated CONNECTION LIMIT -1;
ALTER ROLE anon CONNECTION LIMIT -1;

-- Grant schema usage again to ensure it wasn't dropped
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Verify RLS is disabled on critical tables
SELECT tablename, schemaname, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'resources');

-- Add connection pooling settings if needed
ALTER DATABASE postgres SET statement_timeout = '30s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '15s'; 