-- Create media_type enum
CREATE TYPE media_type AS ENUM (
    'PRINT_MEDIA',
    'DIGITAL_MEDIA',
    'SOCIAL_MEDIA',
    'EMAIL_MARKETING',
    'TRADESHOW',
    'EVENT',
    'OTHER'
);

-- Add new columns to briefs table
ALTER TABLE briefs 
    ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id),
    ADD COLUMN IF NOT EXISTS media_type media_type NOT NULL DEFAULT 'OTHER';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_media_type ON briefs(media_type);
CREATE INDEX IF NOT EXISTS idx_briefs_brand_media ON briefs(brand_id, media_type);

-- Update RLS policies to include brand_id checks
CREATE POLICY "Users can view briefs for their brands"
    ON briefs FOR SELECT
    TO authenticated
    USING (
        -- Admin can view all
        (auth.jwt() ->> 'role' = 'admin')
        OR
        -- Users can view briefs for brands they have access to
        brand_id IN (
            SELECT b.id 
            FROM brands b
            -- Add your brand access control table/logic here
        )
    ); 