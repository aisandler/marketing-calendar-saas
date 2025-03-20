-- Direct update of resource utilization with specific resource IDs
-- This approach has been confirmed to work by testing on a single resource

BEGIN;

-- Set the hours for all briefs to achieve appropriate resource utilization
-- Resource 1: Demo Video Production Co - 80% utilization (we've already updated this one)

-- Resource 2: Demo Freelancer - Alex (Designer) - Slightly overallocated (110%)
-- First get the ID of this resource
UPDATE public.briefs
SET estimated_hours = 4
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Alex (Designer)'
)
AND status != 'cancelled';

-- Resource 3: Demo Editor - David - Optimally allocated (95%)
UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Editor - David'
)
AND status != 'cancelled';

-- Resource 4: Demo Designer - Sarah - Good allocation (85%)
UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Designer - Sarah'
)
AND status != 'cancelled';

-- Resource 5: Demo Designer - Michael - Good allocation (75%)
UPDATE public.briefs
SET estimated_hours = 3
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Designer - Michael'
)
AND status != 'cancelled';

-- Resource 6: Demo Freelancer - Casey (Video) - Available allocation (50%)
UPDATE public.briefs
SET estimated_hours = 2
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Casey (Video)'
)
AND status != 'cancelled';

-- Resource 7: Demo Freelancer - Morgan (Social) - Available allocation (45%)
UPDATE public.briefs
SET estimated_hours = 2
WHERE resource_id IN (
    SELECT id FROM public.resources WHERE name = 'Demo Freelancer - Morgan (Social)'
)
AND status != 'cancelled';

-- Resource 8: All other resources - Light allocation (30-40%)
UPDATE public.briefs
SET estimated_hours = 2
WHERE resource_id IN (
    SELECT id FROM public.resources 
    WHERE name LIKE 'Demo%' 
    AND name NOT IN (
        'Demo Video Production Co',
        'Demo Freelancer - Alex (Designer)',
        'Demo Editor - David',
        'Demo Designer - Sarah',
        'Demo Designer - Michael',
        'Demo Freelancer - Casey (Video)',
        'Demo Freelancer - Morgan (Social)'
    )
)
AND status != 'cancelled';

COMMIT;

-- Show the final resource utilization
SELECT 
    r.name AS resource_name,
    r.type AS resource_type,
    COUNT(b.id) AS brief_count,
    SUM(b.estimated_hours) AS total_hours,
    ROUND((SUM(b.estimated_hours) / 20.0) * 100, 1) AS utilization_percent,
    CASE
        WHEN SUM(b.estimated_hours) > 20 THEN 'Overallocated'
        WHEN SUM(b.estimated_hours) BETWEEN 18 AND 20 THEN 'Optimal'
        WHEN SUM(b.estimated_hours) BETWEEN 14 AND 17.9 THEN 'Good'
        WHEN SUM(b.estimated_hours) BETWEEN 6 AND 13.9 THEN 'Available'
        WHEN SUM(b.estimated_hours) > 0 THEN 'Underutilized'
        ELSE 'Unallocated'
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