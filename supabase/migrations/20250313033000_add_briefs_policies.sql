-- Enable RLS on briefs table
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Create policies for briefs table

-- Everyone can view briefs
CREATE POLICY "Briefs are viewable by all users"
ON public.briefs FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins, managers, and the creator can insert briefs
CREATE POLICY "Briefs are insertable by authenticated users"
ON public.briefs FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() = created_by
);

-- Only admins, managers, and the creator can update briefs
CREATE POLICY "Briefs are updatable by admins, managers, and creators"
ON public.briefs FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    ) OR
    auth.uid() = approver_id
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    ) OR
    auth.uid() = approver_id
  )
);

-- Only admins, managers, and the creator can delete briefs
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