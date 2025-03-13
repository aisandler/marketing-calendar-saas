-- Enable RLS on briefs table
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Briefs are viewable by all users" ON public.briefs;
DROP POLICY IF EXISTS "Briefs are insertable by authenticated users" ON public.briefs;
DROP POLICY IF EXISTS "Briefs are updatable by admins, managers, and creators" ON public.briefs;
DROP POLICY IF EXISTS "Briefs are deletable by admins, managers, and creators" ON public.briefs;

-- Create new policies

-- Everyone can view briefs
CREATE POLICY "Briefs are viewable by all users"
ON public.briefs FOR SELECT
USING (auth.role() = 'authenticated');

-- Authenticated users can create briefs
CREATE POLICY "Briefs are insertable by authenticated users"
ON public.briefs FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Only admins, managers, creators, and approvers can update briefs
CREATE POLICY "Briefs are updatable by admins, managers, creators, and approvers"
ON public.briefs FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (
    auth.uid() = created_by OR
    auth.uid() = approver_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
);

-- Only admins, managers, and creators can delete briefs
CREATE POLICY "Briefs are deletable by admins, managers, and creators"
ON public.briefs FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON public.briefs TO authenticated;
GRANT USAGE ON SEQUENCE briefs_id_seq TO authenticated; 