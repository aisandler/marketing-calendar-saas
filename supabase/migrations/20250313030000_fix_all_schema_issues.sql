-- Fix all schema issues comprehensively

-- Make sure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------
-- Fix resources table
-----------------------------------------
-- Add missing columns to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC DEFAULT 40;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Ensure the updated_at trigger is working for resources
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for team_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_resources_team_id ON public.resources(team_id);

-----------------------------------------
-- Fix briefs table
-----------------------------------------
-- Add missing columns to briefs table
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.resources(id);
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES auth.users(id);
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS expenses NUMERIC DEFAULT 0;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id);
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Ensure the updated_at trigger is working for briefs
DROP TRIGGER IF EXISTS update_briefs_updated_at ON public.briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create helpful indexes for briefs if they don't exist
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON public.briefs(resource_id);
CREATE INDEX IF NOT EXISTS idx_briefs_approver_id ON public.briefs(approver_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_by ON public.briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_campaign_id ON public.briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON public.briefs(brand_id);

-----------------------------------------
-- Fix brands table
-----------------------------------------
-- Make sure description column exists
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure the updated_at trigger is working for brands
DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default brand if none exists
INSERT INTO public.brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for marketing calendar', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.brands LIMIT 1); 