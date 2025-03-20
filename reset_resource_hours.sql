-- Reset resource utilization for specific overallocated resources

BEGIN;

-- Directly set estimated hours for specific overallocated resources
UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Video Production Co'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

UPDATE public.briefs
SET estimated_hours = 2
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Alex (Designer)'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Morgan (Social)'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Casey (Video)'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

UPDATE public.briefs
SET estimated_hours = 4
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Editor - David'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

-- Only for one resource, keep it slightly overallocated (110%) to show the feature
UPDATE public.briefs
SET estimated_hours = 4
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Designer - Jordan'
)
AND title LIKE 'Demo Brief:%'
AND status != 'cancelled';

COMMIT;

-- Show the updated resource utilization
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
    r.name LIKE 'Demo%'
GROUP BY 
    r.id, r.name
ORDER BY 
    utilization_percent DESC NULLS LAST
LIMIT 10; 