-- View current resource utilization
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