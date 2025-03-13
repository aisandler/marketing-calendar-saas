-- First, let's check what policies currently exist for the brands table
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'brands';

-- Look specifically for an INSERT policy
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'brands' AND cmd = 'INSERT';

-- Check if there's a policy for admins/managers to insert
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'brands' 
AND cmd = 'INSERT' 
AND with_check LIKE '%role IN (''admin'', ''manager'')%';

-- Drop any existing INSERT policy that might be causing issues
DROP POLICY IF EXISTS "Only admins and managers can insert brands" ON public.brands;

-- Create a new INSERT policy with proper WITH CHECK clause
CREATE POLICY "Only admins and managers can insert brands" ON public.brands
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;