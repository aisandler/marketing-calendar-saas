-- Test updating just one specific resource
BEGIN;

-- Update hours for Video Production Co to a fixed value across all its briefs
UPDATE public.briefs
SET estimated_hours = 2  -- Set all briefs to 2 hours
WHERE resource_id = '7e37eea2-db3d-4db7-92c0-2d8bc8fea4cd'  -- Demo Video Production Co
AND status != 'cancelled';

COMMIT;

-- Verify the update worked
SELECT 
    r.name AS resource_name,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_hours,
    ROUND((SUM(b.estimated_hours) / 20.0) * 100, 1) AS utilization_percent
FROM 
    public.resources r
LEFT JOIN 
    public.briefs b ON r.id = b.resource_id AND b.status != 'cancelled'
WHERE
    r.id = '7e37eea2-db3d-4db7-92c0-2d8bc8fea4cd'  -- Demo Video Production Co
GROUP BY 
    r.id, r.name; 