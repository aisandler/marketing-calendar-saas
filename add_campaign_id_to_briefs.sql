-- Add campaign_id column to briefs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'briefs'
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE public.briefs
        ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id);
        
        RAISE NOTICE 'Added campaign_id column to briefs table';
    ELSE
        RAISE NOTICE 'campaign_id column already exists in briefs table';
    END IF;
END $$; 