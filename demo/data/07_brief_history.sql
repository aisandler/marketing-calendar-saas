-- Demo Data Generation: Brief History
-- This script creates history records for brief changes to show how briefs evolve over time

-- Create history records for briefs that are completed or in progress
DO $$
DECLARE
    brief_rec RECORD;
    history_count INTEGER := 0;
    status_changes TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete'];
    next_status TEXT;
    prev_state JSONB;
    new_state JSONB;
    changed_by_id UUID;
    created_at TIMESTAMP WITH TIME ZONE;
    status_index INTEGER;
BEGIN
    -- Loop through briefs that are complete or in progress (these should have history)
    FOR brief_rec IN (
        SELECT id, title, status, created_at AS brief_created, 
               updated_at AS brief_updated, start_date, due_date
        FROM public.briefs 
        WHERE title LIKE 'Demo%' 
        AND (status = 'complete' OR status = 'in_progress' OR status = 'review')
        ORDER BY created_at
    ) LOOP
        -- Reset status index to track the current status in the flow
        IF brief_rec.status = 'draft' THEN
            status_index := 1;
        ELSIF brief_rec.status = 'approved' THEN
            status_index := 2;
        ELSIF brief_rec.status = 'in_progress' THEN
            status_index := 3;
        ELSIF brief_rec.status = 'review' THEN
            status_index := 4;
        ELSIF brief_rec.status = 'complete' THEN
            status_index := 5;
        ELSE
            status_index := 1; -- Default for any other status
        END IF;
        
        -- Create 1-4 history records per brief
        FOR i IN 1..floor(random() * 4 + 1) LOOP
            -- We'll create history showing the progression through statuses
            -- Get a random user ID for who made the change
            changed_by_id := demo_random_user(CASE WHEN random() < 0.4 THEN 'manager' ELSE 'contributor' END);
            
            -- The timestamp will be sometime between creation and now
            created_at := brief_rec.brief_created + 
                         (random() * (COALESCE(brief_rec.brief_updated, CURRENT_TIMESTAMP) - brief_rec.brief_created));
            
            -- The status change should show progression
            -- For complete briefs, show the history of getting there
            IF brief_rec.status = 'complete' THEN
                IF i = 1 THEN
                    -- First history record: draft -> approved
                    prev_state := jsonb_build_object(
                        'status', 'draft',
                        'updated_at', brief_rec.brief_created
                    );
                    new_state := jsonb_build_object(
                        'status', 'approved',
                        'updated_at', created_at
                    );
                ELSIF i = 2 THEN
                    -- Second history record: approved -> in_progress
                    prev_state := jsonb_build_object(
                        'status', 'approved',
                        'updated_at', created_at - INTERVAL '2 days'
                    );
                    new_state := jsonb_build_object(
                        'status', 'in_progress',
                        'updated_at', created_at
                    );
                ELSIF i = 3 THEN
                    -- Third history record: in_progress -> review
                    prev_state := jsonb_build_object(
                        'status', 'in_progress',
                        'updated_at', created_at - INTERVAL '2 days'
                    );
                    new_state := jsonb_build_object(
                        'status', 'review',
                        'updated_at', created_at
                    );
                ELSE
                    -- Fourth history record: review -> complete
                    prev_state := jsonb_build_object(
                        'status', 'review',
                        'updated_at', created_at - INTERVAL '1 day'
                    );
                    new_state := jsonb_build_object(
                        'status', 'complete',
                        'updated_at', created_at
                    );
                END IF;
            ELSIF brief_rec.status = 'in_progress' THEN
                IF i = 1 THEN
                    -- First history record: draft -> approved
                    prev_state := jsonb_build_object(
                        'status', 'draft',
                        'updated_at', brief_rec.brief_created
                    );
                    new_state := jsonb_build_object(
                        'status', 'approved',
                        'updated_at', created_at
                    );
                ELSE
                    -- Second history record: approved -> in_progress
                    prev_state := jsonb_build_object(
                        'status', 'approved',
                        'updated_at', created_at - INTERVAL '2 days'
                    );
                    new_state := jsonb_build_object(
                        'status', 'in_progress',
                        'updated_at', created_at
                    );
                END IF;
            ELSE
                -- For other statuses, just show one status change
                IF status_index > 1 THEN
                    prev_state := jsonb_build_object(
                        'status', status_changes[status_index-1],
                        'updated_at', brief_rec.brief_created
                    );
                    new_state := jsonb_build_object(
                        'status', brief_rec.status,
                        'updated_at', created_at
                    );
                ELSE
                    -- If we're still in draft, show an edit to the description or due date
                    prev_state := jsonb_build_object(
                        'description', 'Initial draft description',
                        'due_date', brief_rec.start_date + INTERVAL '7 days',
                        'updated_at', brief_rec.brief_created
                    );
                    new_state := jsonb_build_object(
                        'description', 'Updated description with more details',
                        'due_date', brief_rec.due_date,
                        'updated_at', created_at
                    );
                END IF;
            END IF;
            
            -- Insert history record
            INSERT INTO public.brief_history (
                brief_id,
                changed_by,
                previous_state,
                new_state,
                created_at
            ) VALUES (
                brief_rec.id,
                changed_by_id,
                prev_state,
                new_state,
                created_at
            );
            
            history_count := history_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % brief history records', history_count;
END;
$$;

-- Also add some resource reassignment history
DO $$
DECLARE
    brief_rec RECORD;
    history_count INTEGER := 0;
    old_resource_id UUID;
    new_resource_id UUID;
    changed_by_id UUID;
    created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through some random briefs to add resource reassignment
    FOR brief_rec IN (
        SELECT id, resource_id, created_at AS brief_created, updated_at AS brief_updated
        FROM public.briefs 
        WHERE title LIKE 'Demo%' 
        AND resource_id IS NOT NULL
        ORDER BY random()
        LIMIT 20 -- Only do 20 resource reassignments
    ) LOOP
        -- Get a different resource than the current one
        SELECT id INTO new_resource_id 
        FROM public.resources 
        WHERE name LIKE 'Demo%' AND id != brief_rec.resource_id
        ORDER BY random() 
        LIMIT 1;
        
        -- Get manager to make the change
        changed_by_id := demo_random_user('manager');
        
        -- The timestamp will be sometime between creation and update
        created_at := brief_rec.brief_created + 
                     (random() * (COALESCE(brief_rec.brief_updated, CURRENT_TIMESTAMP) - brief_rec.brief_created));
        
        -- Insert history record for resource reassignment
        INSERT INTO public.brief_history (
            brief_id,
            changed_by,
            previous_state,
            new_state,
            created_at
        ) VALUES (
            brief_rec.id,
            changed_by_id,
            jsonb_build_object(
                'resource_id', brief_rec.resource_id,
                'updated_at', brief_rec.brief_created
            ),
            jsonb_build_object(
                'resource_id', new_resource_id,
                'updated_at', created_at
            ),
            created_at
        );
        
        history_count := history_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % resource reassignment history records', history_count;
END;
$$;

-- Output history statistics
DO $$
DECLARE
    history_count INTEGER;
    briefs_with_history INTEGER;
BEGIN
    SELECT COUNT(*) INTO history_count FROM public.brief_history;
    SELECT COUNT(DISTINCT brief_id) INTO briefs_with_history FROM public.brief_history;
    
    RAISE NOTICE 'Brief history statistics: % total records for % unique briefs', 
        history_count, briefs_with_history;
END;
$$; 