-- Fix for the history table mismatch issue
-- This script updates the history handling trigger to work with the correct table

-- 1. First, create the history table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL,
    changed_by UUID NOT NULL,
    previous_state JSONB NOT NULL,
    new_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update the trigger function to use the 'history' table instead of 'brief_history'
-- and make it more robust with error handling
CREATE OR REPLACE FUNCTION handle_brief_history()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Try to get the current user ID from auth.uid()
        BEGIN
            -- First attempt to get from auth.uid()
            SELECT auth.uid() INTO current_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Fall back to the brief's creator
            current_user_id := NULL;
        END;
        
        -- If we couldn't get the auth.uid(), use the creator of the brief
        IF current_user_id IS NULL THEN
            current_user_id := NEW.created_by;
            
            -- If we still don't have a valid user, use the approver_id if available
            IF current_user_id IS NULL AND NEW.approver_id IS NOT NULL THEN
                current_user_id := NEW.approver_id;
            END IF;
        END IF;
        
        -- Insert into the 'history' table that the application is using
        IF current_user_id IS NOT NULL THEN
            INSERT INTO public.history (
                brief_id,
                changed_by,
                previous_state,
                new_state,
                created_at
            ) VALUES (
                NEW.id,
                current_user_id,
                row_to_json(OLD),
                row_to_json(NEW),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create policies for the history table
-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.history;
DROP POLICY IF EXISTS "Users can view history" ON public.history;

-- Create new policies
CREATE POLICY "Authenticated users can insert history" ON public.history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view history" ON public.history
    FOR SELECT USING (true);

-- Output confirmation
SELECT 'History trigger function updated successfully. The trigger now uses the "history" table.'; 