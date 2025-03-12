-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data consistency
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'contributor');
CREATE TYPE resource_type AS ENUM ('internal', 'agency', 'freelancer');
CREATE TYPE brief_status AS ENUM ('draft', 'pending_approval', 'approved', 'in_progress', 'review', 'complete', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'complete', 'cancelled');

-- Create tables
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'contributor',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type resource_type NOT NULL,
    capacity_hours NUMERIC DEFAULT 40, -- Weekly capacity in hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    brand_id UUID NOT NULL REFERENCES public.brands(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status campaign_status NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_campaign_dates CHECK (end_date >= start_date)
);

CREATE TABLE public.briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    campaign_id UUID REFERENCES public.campaigns(id), -- Optional campaign association
    brand_id UUID NOT NULL REFERENCES public.brands(id),
    resource_id UUID REFERENCES public.resources(id),
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    estimated_hours NUMERIC,
    status brief_status NOT NULL DEFAULT 'draft',
    priority priority_level NOT NULL DEFAULT 'medium',
    channel TEXT NOT NULL,
    specifications JSONB,
    created_by UUID NOT NULL REFERENCES public.users(id),
    approver_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_brief_dates CHECK (due_date >= start_date)
);

CREATE TABLE public.brief_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    previous_state JSONB NOT NULL,
    new_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_briefs_campaign_id ON public.briefs(campaign_id);
CREATE INDEX idx_briefs_brand_id ON public.briefs(brand_id);
CREATE INDEX idx_briefs_resource_id ON public.briefs(resource_id);
CREATE INDEX idx_briefs_status ON public.briefs(status);
CREATE INDEX idx_briefs_due_date ON public.briefs(due_date);
CREATE INDEX idx_campaigns_brand_id ON public.campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_brief_history_brief_id ON public.brief_history(brief_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_history ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users table policies
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only admins can update users" ON public.users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.uid() = id OR
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        )
    );

-- Resources table policies
CREATE POLICY "Users can view all resources" ON public.resources
    FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can manage resources" ON public.resources
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Brands table policies
CREATE POLICY "Users can view all brands" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can manage brands" ON public.brands
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Campaigns table policies
CREATE POLICY "Users can view all campaigns" ON public.campaigns
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update campaigns they created or if admin/manager" ON public.campaigns
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        )
    );

-- Briefs table policies
CREATE POLICY "Users can view all briefs" ON public.briefs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create briefs" ON public.briefs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update briefs they created or if admin/manager" ON public.briefs
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        )
    );

-- Brief history table policies
CREATE POLICY "Users can view brief history" ON public.brief_history
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert brief history" ON public.brief_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a function to handle brief history
CREATE OR REPLACE FUNCTION handle_brief_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.brief_history (
            brief_id,
            changed_by,
            previous_state,
            new_state
        ) VALUES (
            NEW.id,
            auth.uid(),
            row_to_json(OLD),
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for brief history
CREATE TRIGGER brief_history_trigger
    AFTER UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION handle_brief_history();

-- Insert initial admin user (you should change this email)
INSERT INTO public.users (email, name, role)
VALUES ('admin@example.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING; 