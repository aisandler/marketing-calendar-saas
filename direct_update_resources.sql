-- Direct update of resource utilization
-- This script takes a completely different approach by directly truncating all briefs
-- and then applying fixed hours to each resource

BEGIN;

-- First reset all brief hours to 0
UPDATE public.briefs
SET estimated_hours = 0
WHERE title LIKE 'Demo Brief:%';

-- Now set specific fixed hours for each resource
-- Set fixed hours for each brief per resource

-- Resource 1: Slightly overallocated (110%)
UPDATE public.briefs b
SET estimated_hours = 4
WHERE b.resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Alex (Designer)'
)
AND b.title LIKE 'Demo Brief:%'
LIMIT 6;

-- Resource 2: Optimally allocated (95%)
UPDATE public.briefs b
SET estimated_hours = 3
WHERE b.resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Editor - David'
)
AND b.title LIKE 'Demo Brief:%'
LIMIT 7;

-- Resource 3: Heavily allocated but not excessive (85%)
UPDATE public.briefs b
SET estimated_hours = 3
WHERE b.resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Casey (Video)'
)
AND b.title LIKE 'Demo Brief:%'
LIMIT 6;

-- Resource 4: Moderately allocated (75%)
UPDATE public.briefs b
SET estimated_hours = 5
WHERE b.resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Video Production Co'
)
AND b.title LIKE 'Demo Brief:%'
LIMIT 3;

-- Resource 5: Several resources with balanced allocation (60-70%)
UPDATE public.briefs b
SET estimated_hours = 3
WHERE b.resource_id IN (
    SELECT id FROM public.resources WHERE name LIKE 'Demo Designer %'
    OR name LIKE 'Demo Content %'
)
AND b.title LIKE 'Demo Brief:%'
LIMIT 20;

-- Resource 6: Remaining resources with light allocation (30-50%)
UPDATE public.briefs b
SET estimated_hours = 2
WHERE b.estimated_hours = 0
AND b.title LIKE 'Demo Brief:%';

COMMIT;

-- Show the final resource utilization
SELECT 
    r.name AS resource_name,
    r.type AS resource_type,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_hours,
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
    utilization_percent DESC NULLS LAST; 