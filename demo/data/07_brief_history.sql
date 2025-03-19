-- Demo Data Generation: Brief History
-- This script creates historical records for brief progressions

-- Create history records for briefs that have moved through workflow stages
DO $$
DECLARE
    brief_record RECORD;
    status_history brief_status[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete']::brief_status[];
    status_index INTEGER;
    current_status brief_status;
    history_date TIMESTAMP;
    comment_text TEXT;
    user_id UUID;
    brief_history_count INTEGER := 0;
    unique_brief_count INTEGER := 0;
    
    -- Arrays of possible comments for each transition
    draft_comments TEXT[] := ARRAY[
        'Initial brief created for campaign.',
        'Draft brief submitted for review.',
        'Created draft brief with initial specifications.',
        'Preliminary brief requirements documented.'
    ];
    
    approved_comments TEXT[] := ARRAY[
        'Brief approved by marketing manager.',
        'All requirements confirmed, ready to proceed.',
        'Brief meets campaign objectives, approved.',
        'Scope and timeline approved.'
    ];
    
    in_progress_comments TEXT[] := ARRAY[
        'Work started on deliverables.',
        'Resource has begun implementation.',
        'Production phase initiated.',
        'Creative development in progress.'
    ];
    
    review_comments TEXT[] := ARRAY[
        'Deliverables submitted for review.',
        'Ready for stakeholder feedback.',
        'Completed work submitted for approval.',
        'Please review the attached materials.'
    ];
    
    complete_comments TEXT[] := ARRAY[
        'All deliverables finalized and approved.',
        'Brief objectives successfully met.',
        'Project completed within specifications.',
        'Final assets delivered and published.'
    ];
    
BEGIN
    -- Get a random user ID for the history records
    SELECT id INTO user_id FROM public.users 
    WHERE email LIKE '%.demo@example.com'
    ORDER BY random() LIMIT 1;
    
    -- Process completed/in-progress/review briefs (these have a history)
    FOR brief_record IN 
        SELECT b.id, b.title, b.status, 
               b.created_at AS brief_created, 
               b.updated_at AS brief_updated, 
               b.start_date, b.due_date
        FROM public.briefs b
        WHERE b.title LIKE 'Demo%' 
        AND (b.status = 'complete' OR b.status = 'in_progress' OR b.status = 'review')
        ORDER BY b.created_at
    LOOP
        -- Count unique briefs
        unique_brief_count := unique_brief_count + 1;
        
        -- Start with draft status
        current_status := 'draft';
        status_index := 1; -- Draft is the first status
        
        -- Initial creation record
        history_date := brief_record.brief_created;
        comment_text := draft_comments[floor(random() * array_length(draft_comments, 1)) + 1];
        
        -- Insert initial status record
        INSERT INTO public.brief_history (
            brief_id,
            changed_by,
            previous_state,
            new_state,
            created_at
        ) VALUES (
            brief_record.id,
            user_id,
            jsonb_build_object('status', NULL, 'comment', 'Brief created'),
            jsonb_build_object('status', current_status, 'comment', comment_text),
            history_date
        );
        
        brief_history_count := brief_history_count + 1;
        
        -- Determine how far in the workflow this brief has progressed
        IF brief_record.status = 'complete' THEN 
            status_index := 5; -- Go through all statuses
        ELSIF brief_record.status = 'review' THEN 
            status_index := 4; -- Go up to review
        ELSIF brief_record.status = 'in_progress' THEN 
            status_index := 3; -- Go up to in_progress
        ELSIF brief_record.status = 'approved' THEN 
            status_index := 2; -- Go up to approved
        ELSE 
            status_index := 1; -- Shouldn't happen but just in case
        END IF;
        
        -- Generate history for each status transition
        FOR i IN 2..status_index LOOP
            -- Update timestamp - spread events between created_at and updated_at
            history_date := brief_record.brief_created + 
                            (((i - 1.0) / status_index) * 
                             (brief_record.brief_updated - brief_record.brief_created));
            
            -- Previous status
            current_status := status_history[i-1];
            
            -- Comment based on new status
            IF status_history[i] = 'approved' THEN
                comment_text := approved_comments[floor(random() * array_length(approved_comments, 1)) + 1];
            ELSIF status_history[i] = 'in_progress' THEN
                comment_text := in_progress_comments[floor(random() * array_length(in_progress_comments, 1)) + 1];
            ELSIF status_history[i] = 'review' THEN
                comment_text := review_comments[floor(random() * array_length(review_comments, 1)) + 1];
            ELSIF status_history[i] = 'complete' THEN
                comment_text := complete_comments[floor(random() * array_length(complete_comments, 1)) + 1];
            ELSE
                comment_text := 'Status updated.';
            END IF;
            
            -- Insert status change record
            INSERT INTO public.brief_history (
                brief_id,
                changed_by,
                previous_state,
                new_state,
                created_at
            ) VALUES (
                brief_record.id,
                user_id,
                jsonb_build_object('status', current_status, 'comment', 'Previous status'),
                jsonb_build_object('status', status_history[i], 'comment', comment_text),
                history_date
            );
            
            brief_history_count := brief_history_count + 1;
            
            -- Add some comment records between status changes (30% chance)
            IF random() < 0.3 THEN
                -- Add a comment 1-3 days after the status change
                -- For comments, we'll just update the comment field with no status change
                INSERT INTO public.brief_history (
                    brief_id,
                    changed_by,
                    previous_state,
                    new_state,
                    created_at
                ) VALUES (
                    brief_record.id,
                    user_id,
                    jsonb_build_object('comment', ''),
                    jsonb_build_object('comment', 
                        CASE floor(random() * 5)
                            WHEN 0 THEN 'Updated timeline to reflect current progress.'
                            WHEN 1 THEN 'Discussed resource allocation with team.'
                            WHEN 2 THEN 'Clarified specifications with stakeholders.'
                            WHEN 3 THEN 'Added additional reference materials.'
                            ELSE 'Reviewed progress with campaign manager.'
                        END
                    ),
                    history_date + (floor(random() * 3) + 1) * INTERVAL '1 day'
                );
                
                brief_history_count := brief_history_count + 1;
            END IF;
            
            -- Update current status
            current_status := status_history[i];
        END LOOP;
    END LOOP;
    
    -- Create some resource change history records
    FOR brief_record IN 
        SELECT b.id, b.resource_id, 
               b.created_at AS brief_created, 
               b.updated_at AS brief_updated
        FROM public.briefs b
        WHERE b.title LIKE 'Demo%' 
        AND b.resource_id IS NOT NULL
        ORDER BY random()
        LIMIT 20 -- Only do 20 resource reassignments
    LOOP
        -- 50% of briefs get a resource reassignment
        IF random() < 0.5 THEN
            -- Get a new resource that's different from the current one
            DECLARE
                old_resource_id UUID := brief_record.resource_id;
                new_resource_id UUID;
                history_date TIMESTAMP;
                old_resource_name TEXT;
                new_resource_name TEXT;
            BEGIN
                -- Find a different resource
                SELECT id INTO new_resource_id 
                FROM public.resources 
                WHERE name LIKE 'Demo%' AND id != old_resource_id
                ORDER BY random() 
                LIMIT 1;
                
                -- Get resource names
                SELECT name INTO old_resource_name FROM public.resources WHERE id = old_resource_id;
                SELECT name INTO new_resource_name FROM public.resources WHERE id = new_resource_id;
                
                -- Create a history record at some point during the brief's lifetime
                history_date := brief_record.brief_created + 
                               (random() * (brief_record.brief_updated - brief_record.brief_created));
                
                -- Insert resource change record
                INSERT INTO public.brief_history (
                    brief_id,
                    changed_by,
                    previous_state,
                    new_state,
                    created_at
                ) VALUES (
                    brief_record.id,
                    user_id,
                    jsonb_build_object('resource_id', old_resource_id, 'resource_name', old_resource_name),
                    jsonb_build_object(
                        'resource_id', new_resource_id, 
                        'resource_name', new_resource_name,
                        'comment', CASE floor(random() * 4)
                            WHEN 0 THEN 'Reassigned due to availability constraints.'
                            WHEN 1 THEN 'Changed resource to better match skill requirements.'
                            WHEN 2 THEN 'Previous resource unavailable, reassigned.'
                            ELSE 'Optimized resource allocation across team.'
                        END
                    ),
                    history_date
                );
                
                brief_history_count := brief_history_count + 1;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Brief history statistics: % total records for % unique briefs', 
        brief_history_count, unique_brief_count;
END;
$$; 