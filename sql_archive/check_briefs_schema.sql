-- Check if the columns exist in the briefs table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'briefs'
ORDER BY ordinal_position;