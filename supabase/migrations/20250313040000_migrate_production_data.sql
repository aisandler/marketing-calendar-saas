-- Disable triggers temporarily to avoid issues during data import
ALTER TABLE auth.users DISABLE TRIGGER ALL;
ALTER TABLE public.brands DISABLE TRIGGER ALL;
ALTER TABLE public.teams DISABLE TRIGGER ALL;
ALTER TABLE public.resources DISABLE TRIGGER ALL;
ALTER TABLE public.campaigns DISABLE TRIGGER ALL;
ALTER TABLE public.briefs DISABLE TRIGGER ALL;
ALTER TABLE public.brief_history DISABLE TRIGGER ALL;

-- Import data from production dump
\i 'prod_dump.sql'

-- Re-enable triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;
ALTER TABLE public.brands ENABLE TRIGGER ALL;
ALTER TABLE public.teams ENABLE TRIGGER ALL;
ALTER TABLE public.resources ENABLE TRIGGER ALL;
ALTER TABLE public.campaigns ENABLE TRIGGER ALL;
ALTER TABLE public.briefs ENABLE TRIGGER ALL;
ALTER TABLE public.brief_history ENABLE TRIGGER ALL;

-- Verify sequences are up to date
SELECT setval(pg_get_serial_sequence('public.brands', 'id'), coalesce(max(id::text::bigint), 1)) FROM public.brands;
SELECT setval(pg_get_serial_sequence('public.resources', 'id'), coalesce(max(id::text::bigint), 1)) FROM public.resources;
SELECT setval(pg_get_serial_sequence('public.campaigns', 'id'), coalesce(max(id::text::bigint), 1)) FROM public.campaigns;
SELECT setval(pg_get_serial_sequence('public.briefs', 'id'), coalesce(max(id::text::bigint), 1)) FROM public.briefs;

-- Add any missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON public.briefs(resource_id);
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON public.briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON public.briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_by ON public.briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_approver_id ON public.briefs(approver_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);

-- Verify RLS policies
DO $$
BEGIN
    -- Verify briefs policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'briefs' 
        AND policyname = 'Briefs are viewable by all users'
    ) THEN
        CREATE POLICY "Briefs are viewable by all users"
        ON public.briefs FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;

    -- Verify brands policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'brands' 
        AND policyname = 'Users can view all brands'
    ) THEN
        CREATE POLICY "Users can view all brands"
        ON public.brands FOR SELECT
        USING (true);
    END IF;
END $$; 