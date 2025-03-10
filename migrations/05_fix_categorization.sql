-- Fix trade show categorization
UPDATE briefs
SET media_type = 'TRADESHOW'::media_type
WHERE 
    LOWER(title) LIKE '%tradeshow%'
    OR LOWER(title) LIKE '%trade show%'
    OR LOWER(title) LIKE '%trade-show%'
    OR (
        LOWER(title) LIKE '%show%'
        AND (
            LOWER(title) LIKE '%preparation%'
            OR LOWER(title) LIKE '%materials%'
            OR LOWER(title) LIKE '%follow-up%'
            OR LOWER(title) LIKE '%follow up%'
        )
    );

-- Fix campaign categorization
UPDATE briefs
SET media_type = (
    CASE 
        WHEN LOWER(title) LIKE '%digital%' THEN 'DIGITAL_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%print%' OR LOWER(title) LIKE '%materials%' THEN 'PRINT_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%social%' THEN 'SOCIAL_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%email%' THEN 'EMAIL_MARKETING'::media_type
        WHEN LOWER(title) LIKE '%event%' THEN 'EVENT'::media_type
        ELSE 'DIGITAL_MEDIA'::media_type  -- Default campaigns to digital if not specified
    END
)
WHERE 
    LOWER(title) LIKE '%campaign%'
    OR LOWER(title) LIKE '%seasonal%';

-- Verify results
SELECT 
    b.name as brand_name,
    br.media_type,
    COUNT(*) as brief_count
FROM briefs br
JOIN brands b ON b.id = br.brand_id
GROUP BY b.name, br.media_type
ORDER BY b.name, br.media_type;

-- Show detailed categorization for verification
SELECT 
    b.name as brand_name,
    br.title,
    br.media_type
FROM briefs br
JOIN brands b ON b.id = br.brand_id
WHERE 
    LOWER(br.title) LIKE '%trade%show%'
    OR LOWER(br.title) LIKE '%campaign%'
    OR LOWER(br.title) LIKE '%seasonal%'
ORDER BY brand_name, title; 