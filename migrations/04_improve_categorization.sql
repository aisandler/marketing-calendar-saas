-- Improve media type categorization
UPDATE briefs
SET media_type = (
    CASE 
        -- Campaign related items
        WHEN LOWER(title) LIKE '%campaign%' THEN 
            CASE
                WHEN LOWER(title) LIKE '%print%' OR LOWER(description) LIKE '%print%' THEN 'PRINT_MEDIA'::media_type
                WHEN LOWER(title) LIKE '%digital%' OR LOWER(description) LIKE '%digital%' THEN 'DIGITAL_MEDIA'::media_type
                WHEN LOWER(title) LIKE '%social%' OR LOWER(description) LIKE '%social%' THEN 'SOCIAL_MEDIA'::media_type
                ELSE 'DIGITAL_MEDIA'::media_type  -- Default campaigns to digital if not specified
            END
        -- Existing categorization with improvements
        WHEN LOWER(title) LIKE '%print%' OR LOWER(description) LIKE '%print%' 
            OR LOWER(title) LIKE '%catalog%' OR LOWER(description) LIKE '%catalog%'
            OR LOWER(title) LIKE '%brochure%' OR LOWER(description) LIKE '%brochure%'
            OR LOWER(title) LIKE '%magazine%' OR LOWER(description) LIKE '%magazine%'
            OR LOWER(title) LIKE '%ad%' OR LOWER(description) LIKE '%ad%'
            THEN 'PRINT_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%digital%' OR LOWER(description) LIKE '%digital%'
            OR LOWER(title) LIKE '%web%' OR LOWER(description) LIKE '%web%'
            OR LOWER(title) LIKE '%online%' OR LOWER(description) LIKE '%online%'
            OR LOWER(title) LIKE '%banner%' OR LOWER(description) LIKE '%banner%'
            THEN 'DIGITAL_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%social%' OR LOWER(description) LIKE '%social%'
            OR LOWER(title) LIKE '%instagram%' OR LOWER(description) LIKE '%instagram%'
            OR LOWER(title) LIKE '%facebook%' OR LOWER(description) LIKE '%facebook%'
            OR LOWER(title) LIKE '%linkedin%' OR LOWER(description) LIKE '%linkedin%'
            THEN 'SOCIAL_MEDIA'::media_type
        WHEN LOWER(title) LIKE '%email%' OR LOWER(description) LIKE '%email%'
            OR LOWER(title) LIKE '%newsletter%' OR LOWER(description) LIKE '%newsletter%'
            OR LOWER(title) LIKE '%mailchimp%' OR LOWER(description) LIKE '%mailchimp%'
            THEN 'EMAIL_MARKETING'::media_type
        WHEN LOWER(title) LIKE '%trade%show%' OR LOWER(description) LIKE '%trade%show%'
            OR LOWER(title) LIKE '%expo%' OR LOWER(description) LIKE '%expo%'
            OR LOWER(title) LIKE '%exhibition%' OR LOWER(description) LIKE '%exhibition%'
            OR LOWER(title) LIKE '%neocon%' OR LOWER(description) LIKE '%neocon%'
            THEN 'TRADESHOW'::media_type
        WHEN LOWER(title) LIKE '%event%' OR LOWER(description) LIKE '%event%'
            OR LOWER(title) LIKE '%launch%' OR LOWER(description) LIKE '%launch%'
            OR LOWER(title) LIKE '%party%' OR LOWER(description) LIKE '%party%'
            OR LOWER(title) LIKE '%meeting%' OR LOWER(description) LIKE '%meeting%'
            THEN 'EVENT'::media_type
        ELSE 'OTHER'::media_type
    END
);

-- Improve brand assignment for any mismatched briefs
UPDATE briefs
SET brand_id = (
    SELECT id FROM brands b
    WHERE 
        LOWER(briefs.title) LIKE '%' || LOWER(b.code) || '%'
        OR LOWER(briefs.title) LIKE '%' || LOWER(b.name) || '%'
        OR LOWER(briefs.description) LIKE '%' || LOWER(b.code) || '%'
        OR LOWER(briefs.description) LIKE '%' || LOWER(b.name) || '%'
    LIMIT 1
)
WHERE brand_id IS NULL OR brand_id IN (
    -- Only update briefs that might be miscategorized
    SELECT b.id 
    FROM brands b
    WHERE briefs.title NOT ILIKE '%' || b.code || '%'
    AND briefs.title NOT ILIKE '%' || b.name || '%'
);

-- Verify updated results
SELECT 
    b.name as brand_name,
    br.media_type,
    COUNT(*) as brief_count
FROM briefs br
JOIN brands b ON b.id = br.brand_id
GROUP BY b.name, br.media_type
ORDER BY b.name, br.media_type; 