-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_briefs_updated_at ON public.briefs;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'contributor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT
);

-- Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internal', 'agency', 'freelancer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Briefs Table
CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  resource_id UUID REFERENCES public.resources(id),
  approver_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'in_progress', 'review', 'complete', 'cancelled')) DEFAULT 'draft',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  description TEXT,
  specifications JSONB,
  estimated_hours NUMERIC,
  expenses NUMERIC,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tradeshows Table
CREATE TABLE IF NOT EXISTS public.tradeshows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- History Table
CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  previous_state JSONB NOT NULL,
  new_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_briefs_resource_id ON public.briefs(resource_id);
CREATE INDEX IF NOT EXISTS idx_briefs_approver_id ON public.briefs(approver_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_by ON public.briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_due_date ON public.briefs(due_date);
CREATE INDEX IF NOT EXISTS idx_history_brief_id ON public.history(brief_id);
CREATE INDEX IF NOT EXISTS idx_history_changed_by ON public.history(changed_by);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_briefs_updated_at
BEFORE UPDATE ON public.briefs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a sample admin user (you should change the email and name)
INSERT INTO public.users (name, email, role)
VALUES ('Admin User', 'adam@sandlerdigital.ai', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Only admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Only admins can update users" ON public.users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;

DROP POLICY IF EXISTS "Users can view all resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins and managers can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins and managers can update resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins and managers can delete resources" ON public.resources;

DROP POLICY IF EXISTS "Users can view all briefs" ON public.briefs;
DROP POLICY IF EXISTS "All authenticated users can insert briefs" ON public.briefs;
DROP POLICY IF EXISTS "Users can update their own briefs or if they are admin/manager" ON public.briefs;
DROP POLICY IF EXISTS "Only admins, managers, or creators can delete briefs" ON public.briefs;

DROP POLICY IF EXISTS "Users can view all tradeshows" ON public.tradeshows;
DROP POLICY IF EXISTS "Only admins and managers can insert tradeshows" ON public.tradeshows;
DROP POLICY IF EXISTS "Only admins and managers can update tradeshows" ON public.tradeshows;
DROP POLICY IF EXISTS "Only admins and managers can delete tradeshows" ON public.tradeshows;

DROP POLICY IF EXISTS "Users can view all history" ON public.history;
DROP POLICY IF EXISTS "All authenticated users can insert history" ON public.history;
DROP POLICY IF EXISTS "No one can update history" ON public.history;
DROP POLICY IF EXISTS "No one can delete history" ON public.history;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradeshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Only admins can update users" ON public.users
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Only admins can delete users" ON public.users
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Create policies for resources table
CREATE POLICY "Users can view all resources" ON public.resources
  FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can insert resources" ON public.resources
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

CREATE POLICY "Only admins and managers can update resources" ON public.resources
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

CREATE POLICY "Only admins and managers can delete resources" ON public.resources
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

-- Create policies for briefs table
CREATE POLICY "Users can view all briefs" ON public.briefs
  FOR SELECT USING (true);

CREATE POLICY "All authenticated users can insert briefs" ON public.briefs
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users));

CREATE POLICY "Users can update their own briefs or if they are admin/manager" ON public.briefs
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY "Only admins, managers, or creators can delete briefs" ON public.briefs
  FOR DELETE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager'))
  );

-- Create policies for tradeshows table
CREATE POLICY "Users can view all tradeshows" ON public.tradeshows
  FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can insert tradeshows" ON public.tradeshows
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

CREATE POLICY "Only admins and managers can update tradeshows" ON public.tradeshows
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

CREATE POLICY "Only admins and managers can delete tradeshows" ON public.tradeshows
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'manager')));

-- Create policies for history table
CREATE POLICY "Users can view all history" ON public.history
  FOR SELECT USING (true);

CREATE POLICY "All authenticated users can insert history" ON public.history
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users));

-- History should not be updated or deleted
CREATE POLICY "No one can update history" ON public.history
  FOR UPDATE USING (false);

CREATE POLICY "No one can delete history" ON public.history
  FOR DELETE USING (false); 