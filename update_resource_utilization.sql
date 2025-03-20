-- Update resource utilization to be more realistic
-- This script adjusts resource allocation to avoid excessive over-utilization

BEGIN;

-- 1. Collect information about briefs and resources to help with calculations
CREATE TEMPORARY TABLE resource_info AS
SELECT 
    r.id AS resource_id,
    r.name AS resource_name,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_allocated_hours
FROM 
    public.resources r
LEFT JOIN 
    public.briefs b ON r.id = b.resource_id AND b.status != 'cancelled'
GROUP BY 
    r.id, r.name;

-- 2. Update estimated hours for briefs to reduce total allocation
-- Make most resources between 75-95% utilized, with 1-2 slightly over 100%
UPDATE public.briefs b
SET estimated_hours = CASE
    -- Keep a couple resources with slight over-allocation (105-115%)
    WHEN r.total_allocated_hours > 0 AND r.brief_count <= 3 THEN 
        CEIL(b.estimated_hours * (RANDOM() * 0.1 + 1.05) / (r.total_allocated_hours / 20.0))
    
    -- For resources with many briefs, reduce hours proportionally to get utilization to 75-95%
    WHEN r.total_allocated_hours > 20 THEN 
        CEIL(b.estimated_hours * (RANDOM() * 0.2 + 0.75) * 20 / r.total_allocated_hours)
    
    -- For moderately allocated resources, adjust to 85-95% utilization
    ELSE 
        CEIL(b.estimated_hours * (RANDOM() * 0.1 + 0.85) * 20 / GREATEST(r.total_allocated_hours, 1))
END
FROM resource_info r
WHERE b.resource_id = r.resource_id
AND b.title LIKE 'Demo Brief:%'
AND b.status != 'cancelled';

-- 3. Ensure no brief has less than 2 or more than 12 estimated hours
UPDATE public.briefs
SET estimated_hours = 2
WHERE estimated_hours < 2
AND title LIKE 'Demo Brief:%';

UPDATE public.briefs
SET estimated_hours = 12
WHERE estimated_hours > 12
AND title LIKE 'Demo Brief:%';

-- 4. Ensure at least one resource is specifically set to be slightly over capacity (105-110%)
WITH overallocated_resources AS (
    SELECT 
        r.id AS resource_id,
        SUM(b.estimated_hours) AS allocated_hours
    FROM 
        public.resources r
    JOIN 
        public.briefs b ON r.id = b.resource_id
    WHERE 
        b.status != 'cancelled'
        AND r.name LIKE 'Demo%'
    GROUP BY 
        r.id
    ORDER BY 
        RANDOM()
    LIMIT 2
)
UPDATE public.briefs b
SET estimated_hours = CEIL(b.estimated_hours * 1.15)
FROM overallocated_resources o
WHERE b.resource_id = o.resource_id
AND b.status != 'cancelled'
AND b.title LIKE 'Demo Brief:%'
AND o.allocated_hours BETWEEN 15 AND 19;

-- 5. Make sure freelancers generally have lower allocation than internal resources (more realistic)
UPDATE public.briefs b
SET estimated_hours = CEIL(b.estimated_hours * 0.85)
FROM public.resources r
WHERE b.resource_id = r.id
AND r.type = 'freelancer'
AND b.title LIKE 'Demo Brief:%'
AND b.status != 'cancelled';

-- Clean up
DROP TABLE resource_info;

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
    utilization_percent DESC; 