-- Create trigger on briefs table to track history

-- Drop any existing trigger with the same name
DROP TRIGGER IF EXISTS brief_history_trigger ON public.briefs;

-- Create the new trigger
CREATE TRIGGER brief_history_trigger
    AFTER UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_brief_history();

-- Output confirmation
SELECT 'Brief history trigger created successfully!'; 