-- Demo Data Generation: Briefs (Part 2)
-- This script creates briefs for active campaigns, draft campaigns, and standalone briefs

-- Create a batch of briefs for active campaigns
DO $$
DECLARE
    campaign_rec RECORD;
    brand_id UUID;
    brief_count INTEGER := 0;
    channels TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print', 'Digital Ads', 'PR', 'Event'];
    statuses TEXT[] := ARRAY['approved', 'in_progress', 'review', 'complete'];
    priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    rand_channel TEXT;
    rand_status TEXT;
    rand_priority TEXT;
    rand_hours NUMERIC;
    rand_expenses NUMERIC;
    created_by_id UUID;
    approver_id UUID;
    resource_id UUID;
    start_date DATE;
    due_date DATE;
    created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through active campaigns
    FOR campaign_rec IN (
        SELECT id, brand_id, start_date AS campaign_start, end_date AS campaign_end 
        FROM public.campaigns 
        WHERE name LIKE 'Demo%' AND status = 'active'
    ) LOOP
        -- Create 5-10 briefs per active campaign
        FOR i IN 1..floor(random() * 6 + 5) LOOP
            -- Random values
            rand_channel := channels[floor(random() * array_length(channels, 1)) + 1];
            
            -- More variation in active campaign briefs
            IF random() < 0.4 THEN
                rand_status := 'complete'; -- Some are complete
            ELSIF random() < 0.5 THEN
                rand_status := 'in_progress'; -- Many in progress
            ELSIF random() < 0.7 THEN
                rand_status := 'approved'; -- Some approved
            ELSE
                rand_status := 'review'; -- Few in review
            END IF;
            
            rand_priority := priorities[floor(random() * array_length(priorities, 1)) + 1];
            rand_hours := floor(random() * 40) + 5; -- 5 to 45 hours
            rand_expenses := floor(random() * 500) + 100; -- $100 to $600
            
            -- Get random IDs
            created_by_id := demo_random_user(CASE WHEN random() < 0.7 THEN 'contributor' ELSE 'manager' END);
            approver_id := demo_random_user('manager');
            resource_id := demo_random_resource(
                CASE WHEN random() < 0.7 THEN 'internal' ELSE ARRAY['agency', 'freelancer'][floor(random() * 2) + 1] END,
                CASE 
                    WHEN rand_channel = 'Social Media' THEN 'Social'
                    WHEN rand_channel = 'Video' THEN 'Video'
                    WHEN rand_channel = 'Website' THEN 'Web Development'
                    WHEN rand_channel = 'Digital Ads' THEN 'Paid Media'
                    ELSE NULL
                END
            );
            
            -- Generate realistic dates within campaign timeframe, but some will be past, some current, some future
            IF rand_status = 'complete' THEN
                -- Completed briefs in the past
                start_date := demo_random_date(campaign_rec.campaign_start, CURRENT_DATE - INTERVAL '15 days');
                due_date := demo_random_date(start_date + INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days');
            ELSIF rand_status = 'in_progress' THEN
                -- In progress briefs span current date
                start_date := demo_random_date(campaign_rec.campaign_start, CURRENT_DATE - INTERVAL '5 days');
                due_date := demo_random_date(CURRENT_DATE + INTERVAL '5 days', campaign_rec.campaign_end);
            ELSE
                -- Future briefs
                start_date := demo_random_date(CURRENT_DATE, CURRENT_DATE + INTERVAL '20 days');
                due_date := demo_random_date(start_date + INTERVAL '5 days', campaign_rec.campaign_end);
            END IF;
            
            created_at := (start_date - INTERVAL '10 days')::TIMESTAMP WITH TIME ZONE;
            
            -- Insert brief
            INSERT INTO public.briefs (
                title,
                description,
                campaign_id,
                brand_id,
                resource_id,
                start_date,
                due_date,
                estimated_hours,
                expenses,
                status,
                priority,
                channel,
                specifications,
                created_by,
                approver_id,
                created_at,
                updated_at
            ) VALUES (
                'Demo ' || rand_channel || ' - ' || to_char(due_date, 'Mon YYYY') || ' - ' || i,
                'Brief for ' || rand_channel || ' deliverable as part of the ' || (SELECT name FROM public.campaigns WHERE id = campaign_rec.id) || ' campaign.',
                campaign_rec.id,
                campaign_rec.brand_id,
                resource_id,
                start_date,
                due_date,
                rand_hours,
                rand_expenses,
                rand_status,
                rand_priority,
                rand_channel,
                demo_brief_specs(rand_channel),
                created_by_id,
                approver_id,
                created_at,
                created_at + INTERVAL '2 days'
            );
            
            brief_count := brief_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % briefs for active campaigns', brief_count;
END;
$$;

-- Create a batch of briefs for draft campaigns
DO $$
DECLARE
    campaign_rec RECORD;
    brand_id UUID;
    brief_count INTEGER := 0;
    channels TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print', 'Digital Ads', 'PR', 'Event'];
    priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    rand_channel TEXT;
    rand_priority TEXT;
    rand_hours NUMERIC;
    rand_expenses NUMERIC;
    created_by_id UUID;
    approver_id UUID;
    resource_id UUID;
    start_date DATE;
    due_date DATE;
    created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through draft campaigns
    FOR campaign_rec IN (
        SELECT id, brand_id, start_date AS campaign_start, end_date AS campaign_end 
        FROM public.campaigns 
        WHERE name LIKE 'Demo%' AND status = 'draft'
    ) LOOP
        -- Create 2-4 briefs per draft campaign
        FOR i IN 1..floor(random() * 3 + 2) LOOP
            -- Random values
            rand_channel := channels[floor(random() * array_length(channels, 1)) + 1];
            rand_priority := priorities[floor(random() * array_length(priorities, 1)) + 1];
            rand_hours := floor(random() * 40) + 5; -- 5 to 45 hours
            rand_expenses := floor(random() * 500) + 100; -- $100 to $600
            
            -- Get random IDs
            created_by_id := demo_random_user(CASE WHEN random() < 0.7 THEN 'contributor' ELSE 'manager' END);
            approver_id := demo_random_user('manager');
            resource_id := demo_random_resource(
                CASE WHEN random() < 0.7 THEN 'internal' ELSE ARRAY['agency', 'freelancer'][floor(random() * 2) + 1] END,
                CASE 
                    WHEN rand_channel = 'Social Media' THEN 'Social'
                    WHEN rand_channel = 'Video' THEN 'Video'
                    WHEN rand_channel = 'Website' THEN 'Web Development'
                    WHEN rand_channel = 'Digital Ads' THEN 'Paid Media'
                    ELSE NULL
                END
            );
            
            -- Generate future dates for draft campaign briefs
            start_date := demo_random_date(campaign_rec.campaign_start, campaign_rec.campaign_start + INTERVAL '15 days');
            due_date := demo_random_date(start_date + INTERVAL '5 days', campaign_rec.campaign_end - INTERVAL '5 days');
            created_at := CURRENT_DATE::TIMESTAMP WITH TIME ZONE;
            
            -- Insert brief
            INSERT INTO public.briefs (
                title,
                description,
                campaign_id,
                brand_id,
                resource_id,
                start_date,
                due_date,
                estimated_hours,
                expenses,
                status,
                priority,
                channel,
                specifications,
                created_by,
                approver_id,
                created_at,
                updated_at
            ) VALUES (
                'Demo ' || rand_channel || ' - ' || to_char(due_date, 'Mon YYYY') || ' - ' || i,
                'Brief for ' || rand_channel || ' deliverable as part of the ' || (SELECT name FROM public.campaigns WHERE id = campaign_rec.id) || ' campaign.',
                campaign_rec.id,
                campaign_rec.brand_id,
                resource_id,
                start_date,
                due_date,
                rand_hours,
                rand_expenses,
                'draft', -- All are draft status
                rand_priority,
                rand_channel,
                demo_brief_specs(rand_channel),
                created_by_id,
                approver_id,
                created_at,
                created_at
            );
            
            brief_count := brief_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % briefs for draft campaigns', brief_count;
END;
$$;

-- Create some standalone briefs (not tied to campaigns)
DO $$
DECLARE
    brief_count INTEGER := 0;
    channels TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print', 'Digital Ads', 'PR', 'Event'];
    statuses TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
    priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    brands_rec RECORD;
    brand_id UUID;
    rand_channel TEXT;
    rand_status TEXT;
    rand_priority TEXT;
    rand_hours NUMERIC;
    rand_expenses NUMERIC;
    created_by_id UUID;
    approver_id UUID;
    resource_id UUID;
    start_date DATE;
    due_date DATE;
    created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Create 15-25 standalone briefs
    FOR i IN 1..floor(random() * 11 + 15) LOOP
        -- Get a random brand
        SELECT id INTO brand_id FROM public.brands 
        WHERE name LIKE 'Demo%' 
        ORDER BY random() LIMIT 1;
        
        -- Random values
        rand_channel := channels[floor(random() * array_length(channels, 1)) + 1];
        rand_status := statuses[floor(random() * array_length(statuses, 1)) + 1];
        rand_priority := priorities[floor(random() * array_length(priorities, 1)) + 1];
        rand_hours := floor(random() * 40) + 5; -- 5 to 45 hours
        rand_expenses := floor(random() * 500) + 100; -- $100 to $600
        
        -- Get random IDs
        created_by_id := demo_random_user(CASE WHEN random() < 0.7 THEN 'contributor' ELSE 'manager' END);
        approver_id := demo_random_user('manager');
        resource_id := demo_random_resource(
            CASE WHEN random() < 0.7 THEN 'internal' ELSE ARRAY['agency', 'freelancer'][floor(random() * 2) + 1] END,
            CASE 
                WHEN rand_channel = 'Social Media' THEN 'Social'
                WHEN rand_channel = 'Video' THEN 'Video'
                WHEN rand_channel = 'Website' THEN 'Web Development'
                WHEN rand_channel = 'Digital Ads' THEN 'Paid Media'
                ELSE NULL
            END
        );
        
        -- Generate dates based on status
        IF rand_status = 'complete' OR rand_status = 'cancelled' THEN
            -- Past briefs
            start_date := demo_random_date(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '1 month');
            due_date := demo_random_date(start_date + INTERVAL '7 days', CURRENT_DATE - INTERVAL '5 days');
            created_at := (start_date - INTERVAL '10 days')::TIMESTAMP WITH TIME ZONE;
        ELSIF rand_status = 'in_progress' OR rand_status = 'review' THEN
            -- Current briefs
            start_date := demo_random_date(CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE);
            due_date := demo_random_date(CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 weeks');
            created_at := (start_date - INTERVAL '5 days')::TIMESTAMP WITH TIME ZONE;
        ELSE
            -- Future briefs
            start_date := demo_random_date(CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 month');
            due_date := demo_random_date(start_date + INTERVAL '7 days', CURRENT_DATE + INTERVAL '2 months');
            created_at := CURRENT_DATE::TIMESTAMP WITH TIME ZONE;
        END IF;
        
        -- Insert brief
        INSERT INTO public.briefs (
            title,
            description,
            campaign_id, -- NULL for standalone briefs
            brand_id,
            resource_id,
            start_date,
            due_date,
            estimated_hours,
            expenses,
            status,
            priority,
            channel,
            specifications,
            created_by,
            approver_id,
            created_at,
            updated_at
        ) VALUES (
            'Demo Standalone ' || rand_channel || ' - ' || to_char(due_date, 'Mon YYYY') || ' - ' || i,
            'Standalone brief for ' || rand_channel || ' deliverable, not associated with any campaign.',
            NULL,
            brand_id,
            resource_id,
            start_date,
            due_date,
            rand_hours,
            rand_expenses,
            rand_status,
            rand_priority,
            rand_channel,
            demo_brief_specs(rand_channel),
            created_by_id,
            approver_id,
            created_at,
            created_at + (random() * INTERVAL '3 days')
        );
        
        brief_count := brief_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % standalone briefs', brief_count;
END;
$$;

-- Output brief statistics
DO $$
DECLARE
    total_count INTEGER;
    draft_count INTEGER;
    approved_count INTEGER;
    in_progress_count INTEGER;
    review_count INTEGER;
    complete_count INTEGER;
    cancelled_count INTEGER;
    campaign_brief_count INTEGER;
    standalone_brief_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.briefs WHERE title LIKE 'Demo%';
    SELECT COUNT(*) INTO draft_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'draft';
    SELECT COUNT(*) INTO approved_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'approved';
    SELECT COUNT(*) INTO in_progress_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'in_progress';
    SELECT COUNT(*) INTO review_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'review';
    SELECT COUNT(*) INTO complete_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'complete';
    SELECT COUNT(*) INTO cancelled_count FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'cancelled';
    SELECT COUNT(*) INTO campaign_brief_count FROM public.briefs WHERE title LIKE 'Demo%' AND campaign_id IS NOT NULL;
    SELECT COUNT(*) INTO standalone_brief_count FROM public.briefs WHERE title LIKE 'Demo%' AND campaign_id IS NULL;
    
    RAISE NOTICE 'Demo briefs created: %', total_count;
    RAISE NOTICE 'Status breakdown: % draft, % approved, % in-progress, % review, % complete, % cancelled', 
        draft_count, approved_count, in_progress_count, review_count, complete_count, cancelled_count;
    RAISE NOTICE 'Association: % campaign briefs, % standalone briefs',
        campaign_brief_count, standalone_brief_count;
END;
$$; 