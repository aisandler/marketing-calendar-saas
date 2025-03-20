-- Final fix for resource utilization
-- This script directly sets hours for each resource to ensure realistic utilization

BEGIN;

-- Set a maximum allocation cap of 24 hours (120% utilization)
-- For any resource with over 24 hours allocated, scale all their briefs down proportionally
WITH overallocated AS (
    SELECT 
        r.id AS resource_id,
        r.name AS resource_name,
        SUM(b.estimated_hours) AS total_hours
    FROM 
        public.resources r
    JOIN 
        public.briefs b ON r.id = b.resource_id
    WHERE 
        b.status != 'cancelled'
        AND r.name LIKE 'Demo%'
    GROUP BY 
        r.id, r.name
    HAVING 
        SUM(b.estimated_hours) > 24
)
UPDATE public.briefs b
SET estimated_hours = CEIL(b.estimated_hours * 24 / o.total_hours)
FROM overallocated o
WHERE b.resource_id = o.resource_id
AND b.status != 'cancelled'
AND b.title LIKE 'Demo Brief:%';

-- For Demo Video Production Co, set a specific lower allocation (90%)
UPDATE public.briefs b
SET estimated_hours = CEIL(estimated_hours * 0.90) 
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Video Production Co'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

-- Make one or two resources right at 100% utilization for the demo
WITH almost_optimal AS (
    SELECT 
        r.id AS resource_id,
        r.name AS resource_name,
        SUM(b.estimated_hours) AS total_hours
    FROM 
        public.resources r
    JOIN 
        public.briefs b ON r.id = b.resource_id
    WHERE 
        b.status != 'cancelled'
        AND r.name LIKE 'Demo%'
    GROUP BY 
        r.id, r.name
    HAVING 
        SUM(b.estimated_hours) BETWEEN 16 AND 19  -- 80-95% utilization
    ORDER BY random()
    LIMIT 2
)
UPDATE public.briefs b
SET estimated_hours = CEIL(b.estimated_hours * 20 / o.total_hours)
FROM almost_optimal o
WHERE b.resource_id = o.resource_id
AND b.status != 'cancelled'
AND b.title LIKE 'Demo Brief:%';

-- Make sure no brief has less than 2 hours or more than 10 hours
UPDATE public.briefs
SET estimated_hours = 2
WHERE estimated_hours < 2
AND title LIKE 'Demo Brief:%';

UPDATE public.briefs
SET estimated_hours = 10
WHERE estimated_hours > 10
AND title LIKE 'Demo Brief:%';

-- Create a nice distribution of utilization
-- 1 resource at ~110-120% (slightly over)
-- 2-3 resources at 90-100% (optimal)
-- 3-4 resources at 70-90% (good)
-- Rest at 30-70% (available)

COMMIT;

-- Show final results of the resource utilization fixes
SELECT 
    r.name AS resource_name,
    r.type AS resource_type,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_allocated_hours,
    ROUND((SUM(b.estimated_hours) / 20.0) * 100, 1) AS utilization_percent,
    CASE
        WHEN SUM(b.estimated_hours) > 20 THEN 'Overallocated'
        WHEN SUM(b.estimated_hours) BETWEEN 18 AND 20 THEN 'Optimal'
        WHEN SUM(b.estimated_hours) BETWEEN 14 AND 17.9 THEN 'Good'
        WHEN SUM(b.estimated_hours) BETWEEN 6 AND 13.9 THEN 'Available'
        ELSE 'Underutilized'
    END AS status
FROM 
    public.resources r
LEFT JOIN 
    public.briefs b ON r.id = b.resource_id AND b.status != 'cancelled'
WHERE
    r.name LIKE 'Demo%'
GROUP BY 
    r.id, r.name, r.type
ORDER BY 
    utilization_percent DESC NULLS LAST; 