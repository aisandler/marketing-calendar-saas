-- Only delete and recreate the "Only admins and managers can manage brands" policy
-- Leave the existing "Users can view all brands" policy alone
DROP POLICY IF EXISTS "Only admins and managers can manage brands" ON public.brands;

-- Create separate policies for update, delete and insert operations
CREATE POLICY "Only admins and managers can update brands" ON public.brands
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Only admins and managers can delete brands" ON public.brands
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Only admins and managers can insert brands" ON public.brands
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Alternatively, you can temporarily disable RLS on brands table for testing
-- ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;