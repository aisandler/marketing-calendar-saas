-- Insert initial brands
INSERT INTO brands (name, code, color) 
VALUES 
    ('Display Dispensary', 'DD', '#4A90E2'),  -- Blue
    ('Econoco', 'EC', '#50C878'),            -- Emerald
    ('Fixtures and Displays', 'FD', '#FF6B6B'),            -- Coral
    ('Mondo Mannequins', 'MM', '#9B59B6'),            -- Purple
    ('Sellutions', 'SL', '#F1C40F')             -- Yellow
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color;

-- Create a temporary table to store brief-to-brand mappings
CREATE TEMP TABLE brief_brand_mapping (
    brief_pattern TEXT,
    brand_id UUID
);

-- Insert mapping rules for each brand
INSERT INTO brief_brand_mapping (brief_pattern, brand_id)
SELECT 'DD%', id FROM brands WHERE code = 'DD'  -- Display Dispensary patterns
UNION ALL
SELECT 'DISPLAY%DISPENSARY%', id FROM brands WHERE code = 'DD'
UNION ALL
SELECT 'EC%', id FROM brands WHERE code = 'EC'  -- Econoco patterns
UNION ALL
SELECT 'ECONOCO%', id FROM brands WHERE code = 'EC'
UNION ALL
SELECT 'FD%', id FROM brands WHERE code = 'FD'  -- Fixtures and Displays patterns
UNION ALL
SELECT 'FIXTURE%', id FROM brands WHERE code = 'FD'
UNION ALL
SELECT 'MM%', id FROM brands WHERE code = 'MM'  -- Mondo Mannequins patterns
UNION ALL
SELECT 'MONDO%', id FROM brands WHERE code = 'MM'
UNION ALL
SELECT 'MANNEQUIN%', id FROM brands WHERE code = 'MM'
UNION ALL
SELECT 'SL%', id FROM brands WHERE code = 'SL'  -- Sellutions patterns
UNION ALL
SELECT 'SELLUTIONS%', id FROM brands WHERE code = 'SL';

-- Update existing briefs based on patterns
UPDATE briefs
SET 
    brand_id = (
        SELECT brand_id 
        FROM brief_brand_mapping 
        WHERE briefs.title ILIKE brief_pattern
        LIMIT 1
    ),
    media_type = (
        CASE 
            WHEN LOWER(title) LIKE '%print%' OR LOWER(description) LIKE '%print%' 
                OR LOWER(title) LIKE '%catalog%' OR LOWER(description) LIKE '%catalog%'
                OR LOWER(title) LIKE '%brochure%' OR LOWER(description) LIKE '%brochure%'
                THEN 'PRINT_MEDIA'::media_type
            WHEN LOWER(title) LIKE '%digital%' OR LOWER(description) LIKE '%digital%'
                OR LOWER(title) LIKE '%web%' OR LOWER(description) LIKE '%web%'
                OR LOWER(title) LIKE '%online%' OR LOWER(description) LIKE '%online%'
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
                THEN 'TRADESHOW'::media_type
            WHEN LOWER(title) LIKE '%event%' OR LOWER(description) LIKE '%event%'
                OR LOWER(title) LIKE '%launch%' OR LOWER(description) LIKE '%launch%'
                OR LOWER(title) LIKE '%party%' OR LOWER(description) LIKE '%party%'
                OR LOWER(title) LIKE '%meeting%' OR LOWER(description) LIKE '%meeting%'
                THEN 'EVENT'::media_type
            ELSE 'OTHER'::media_type
        END
    )
WHERE brand_id IS NULL;

-- Set default brand for any remaining unassigned briefs
UPDATE briefs 
SET brand_id = (SELECT id FROM brands LIMIT 1)
WHERE brand_id IS NULL;

-- Drop temporary table
DROP TABLE brief_brand_mapping;

-- Verify results
SELECT 
    b.name as brand_name,
    br.media_type,
    COUNT(*) as brief_count
FROM briefs br
JOIN brands b ON b.id = br.brand_id
GROUP BY b.name, br.media_type
ORDER BY b.name, br.media_type;

-- Check what happened to Display Dispensary briefs
SELECT 
    DISTINCT b.name as current_brand,
    br.title,
    br.media_type
FROM briefs br
JOIN brands b ON b.id = br.brand_id
WHERE 
    LOWER(br.title) LIKE '%dd%'
    OR LOWER(br.title) LIKE '%display%'
    OR LOWER(br.title) LIKE '%dispensary%'
ORDER BY current_brand, title;

-- Check for potential trade show briefs that might have been miscategorized
SELECT 
    b.name as brand_name,
    br.title,
    br.media_type
FROM briefs br
JOIN brands b ON b.id = br.brand_id
WHERE 
    LOWER(br.title) LIKE '%show%'
    OR LOWER(br.title) LIKE '%expo%'
    OR LOWER(br.title) LIKE '%exhibition%'
ORDER BY brand_name, title; 