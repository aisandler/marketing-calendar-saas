-- Fix specific overallocated resources
-- This script directly addresses resources with extremely high utilization

BEGIN;

-- 1. Fix the Demo Video Production Co resource which has extremely high utilization
UPDATE public.briefs b
SET estimated_hours = CEIL(estimated_hours * 0.2)  -- Reduce hours to about 20% of current value
WHERE b.resource_id IN (
    SELECT r.id
    FROM public.resources r
    WHERE r.name = 'Demo Video Production Co'
)
AND b.title LIKE 'Demo Brief:%'
AND b.status != 'cancelled';

-- 2. Fix any other resources with extremely high utilization (over 150%)
UPDATE public.briefs b
SET estimated_hours = CEIL(estimated_hours * (30.0 / total_hours))
FROM (
    SELECT 
        r.id AS resource_id,
        SUM(b2.estimated_hours) AS total_hours
    FROM 
        public.resources r
    LEFT JOIN 
        public.briefs b2 ON r.id = b2.resource_id AND b2.status != 'cancelled'
    GROUP BY 
        r.id
    HAVING 
        SUM(b2.estimated_hours) > 30  -- 150% utilization
) AS overallocated
WHERE b.resource_id = overallocated.resource_id
AND b.title LIKE 'Demo Brief:%'
AND b.status != 'cancelled';

-- 3. Make sure no brief has less than 2 estimated hours
UPDATE public.briefs
SET estimated_hours = 2
WHERE estimated_hours < 2
AND title LIKE 'Demo Brief:%';

COMMIT;

-- Show results of the updates
SELECT 
    r.name AS resource_name,
    r.type AS resource_type,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_allocated_hours,
    ROUND((SUM(b.estimated_hours) / 20.0) * 100, 1) AS utilization_percent
FROM 
    public.resources r
LEFT JOIN 
    public.briefs b ON r.id = b.resource_id AND b.status != 'cancelled'
WHERE
    r.name LIKE 'Demo%'
GROUP BY 
    r.id, r.name, r.type
ORDER BY 
    utilization_percent DESC NULLS LAST
LIMIT 10; 