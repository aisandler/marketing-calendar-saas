-- Check if the columns exist in the resources table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;