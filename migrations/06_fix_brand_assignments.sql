-- Fix MONDO campaign assignments
UPDATE briefs
SET brand_id = (SELECT id FROM brands WHERE code = 'MM')
WHERE LOWER(title) LIKE '%mondo%campaign%';

-- Fix any remaining brand assignments based on specific keywords
UPDATE briefs
SET brand_id = (
    CASE
        WHEN LOWER(title) LIKE '%mondo%' THEN (SELECT id FROM brands WHERE code = 'MM')
        WHEN LOWER(title) LIKE '%display%dispensary%' OR LOWER(title) LIKE '%dd%' THEN (SELECT id FROM brands WHERE code = 'DD')
        WHEN LOWER(title) LIKE '%econoco%' OR LOWER(title) LIKE '%ec%' THEN (SELECT id FROM brands WHERE code = 'EC')
        WHEN LOWER(title) LIKE '%fixture%' OR LOWER(title) LIKE '%fd%' THEN (SELECT id FROM brands WHERE code = 'FD')
        WHEN LOWER(title) LIKE '%sellutions%' OR LOWER(title) LIKE '%sl%' THEN (SELECT id FROM brands WHERE code = 'SL')
    END
)
WHERE 
    -- Only update where the title contains a brand name but is assigned to a different brand
    (LOWER(title) LIKE '%mondo%' AND brand_id != (SELECT id FROM brands WHERE code = 'MM'))
    OR (LOWER(title) LIKE '%display%dispensary%' AND brand_id != (SELECT id FROM brands WHERE code = 'DD'))
    OR (LOWER(title) LIKE '%econoco%' AND brand_id != (SELECT id FROM brands WHERE code = 'EC'))
    OR (LOWER(title) LIKE '%fixture%' AND brand_id != (SELECT id FROM brands WHERE code = 'FD'))
    OR (LOWER(title) LIKE '%sellutions%' AND brand_id != (SELECT id FROM brands WHERE code = 'SL'));

-- Verify results
SELECT 
    b.name as brand_name,
    br.media_type,
    COUNT(*) as brief_count
FROM briefs br
JOIN brands b ON b.id = br.brand_id
GROUP BY b.name, br.media_type
ORDER BY b.name, br.media_type;

-- Show detailed campaign assignments
SELECT 
    b.name as brand_name,
    br.title,
    br.media_type
FROM briefs br
JOIN brands b ON b.id = br.brand_id
WHERE LOWER(br.title) LIKE '%campaign%'
ORDER BY brand_name, title; 