-- Demo Data Generation: Briefs (Part 2 of 2)
-- This script creates briefs for fashion, home, outdoor, food, and finance brands

-- Fashion brand briefs
DO $$
DECLARE
    campaign_id UUID;
    campaign_record RECORD;
    brief_count INTEGER := 0;
    resource_id UUID;
    brief_title TEXT;
    brief_status brief_status;
    brief_start_date DATE;
    brief_due_date DATE;
    brief_description TEXT;
    created_at TIMESTAMP;
    priority priority_level;
    channel_value TEXT;
    user_id UUID;
    status_array TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
    priority_array TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    channel_array TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print'];
    fashion_descriptions TEXT[] := ARRAY[
        'Create fashion lookbook for fall collection',
        'Design Instagram story series featuring new accessories',
        'Develop video showcase of runway collection',
        'Create lifestyle photography for marketing materials',
        'Design email template for VIP collection preview',
        'Create Facebook carousel showcasing seasonal looks',
        'Design digital catalog of luxury pieces'
    ];
BEGIN
    -- For Demo Luxury Fashion campaigns
    FOR campaign_record IN 
        SELECT c.id, c.name, c.start_date, c.end_date, c.status 
        FROM public.campaigns c
        WHERE c.brand_id = (SELECT id FROM public.brands WHERE name = 'Demo Luxury Fashion')
        AND c.name LIKE 'Demo%'
    LOOP
        campaign_id := campaign_record.id;
        
        -- Create 3-4 briefs per campaign
        FOR i IN 1..floor(random()*2)+3 LOOP
            -- Get a random resource
            SELECT id INTO resource_id FROM public.resources 
            WHERE name LIKE 'Demo%' AND 
            (media_type IN ('Graphics', 'Video', 'Social', 'Full Service'))
            ORDER BY random() LIMIT 1;
            
            -- Get a random user ID
            SELECT id INTO user_id FROM public.users 
            WHERE email LIKE '%.demo@example.com'
            ORDER BY random() LIMIT 1;
            
            -- Set title based on campaign
            brief_title := 'Demo Brief: ' || 
                           substring(campaign_record.name FROM 6) || ' - ' || 
                           (CASE 
                               WHEN i = 1 THEN 'Collection Preview'
                               WHEN i = 2 THEN 'Fashion Showcase'
                               WHEN i = 3 THEN 'Editorial Content'
                               ELSE 'Fashion Asset ' || i::TEXT
                            END);
            
            -- Set status based on campaign status
            IF campaign_record.status = 'complete' THEN
                brief_status := 'complete';
            ELSIF campaign_record.status = 'active' THEN
                brief_status := status_array[(floor(random() * 3) + 2)]::brief_status;
            ELSE
                brief_status := status_array[(floor(random() * 2) + 1)]::brief_status;
            END IF;
            
            -- Set start date at least 1-2 weeks before due date
            brief_start_date := campaign_record.start_date - (floor(random() * 7) + 7)::INTEGER;
            
            -- Set due date based on campaign timeline
            brief_due_date := campaign_record.start_date + 
                        (floor(random() * (campaign_record.end_date - campaign_record.start_date) / 3))::INTEGER;
            
            -- Set created_at timestamp
            created_at := brief_start_date - (floor(random() * 10) + 5)::INTEGER * INTERVAL '1 day' + 
                         floor(random() * 12)::INTEGER * INTERVAL '1 hour';
                         
            -- Set priority
            priority := priority_array[(floor(random() * 4) + 1)]::priority_level;
            
            -- Set channel
            channel_value := channel_array[(floor(random() * array_length(channel_array, 1)) + 1)];
            
            -- Set description
            brief_description := fashion_descriptions[(floor(random() * array_length(fashion_descriptions, 1)) + 1)];
            
            -- Insert the brief
            INSERT INTO public.briefs (
                title, 
                description, 
                status, 
                campaign_id,
                resource_id,
                start_date,
                due_date,
                created_at,
                updated_at,
                priority,
                brand_id,
                channel,
                created_by,
                estimated_hours
            ) VALUES (
                brief_title,
                brief_description,
                brief_status,
                campaign_id,
                resource_id,
                brief_start_date,
                brief_due_date,
                created_at,
                created_at + (floor(random() * 36) + 1)::INTEGER * INTERVAL '1 hour',
                priority,
                (SELECT brand_id FROM public.campaigns WHERE id = campaign_id),
                channel_value,
                user_id,
                (floor(random() * 20) + 5)::INTEGER
            );
            
            brief_count := brief_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % fashion brand briefs', brief_count;
END;
$$;

-- Home brand briefs
DO $$
DECLARE
    campaign_id UUID;
    campaign_record RECORD;
    brief_count INTEGER := 0;
    resource_id UUID;
    brief_title TEXT;
    brief_status brief_status;
    brief_start_date DATE;
    brief_due_date DATE;
    brief_description TEXT;
    created_at TIMESTAMP;
    priority priority_level;
    channel_value TEXT;
    user_id UUID;
    status_array TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
    priority_array TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    channel_array TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print'];
    resource_type_var TEXT;
    home_descriptions TEXT[] := ARRAY[
        'Create product photos of home office furniture line',
        'Design social media campaign for small space solutions',
        'Create video showcasing modular furniture features',
        'Design catalog of new living room collection',
        'Create Pinterest campaign for interior design inspiration',
        'Design email series featuring room makeovers'
    ];
BEGIN
    -- For Demo Urban Dwellings campaigns
    FOR campaign_record IN 
        SELECT c.id, c.name, c.start_date, c.end_date, c.status 
        FROM public.campaigns c
        WHERE c.brand_id = (SELECT id FROM public.brands WHERE name = 'Demo Urban Dwellings')
        AND c.name LIKE 'Demo%'
    LOOP
        campaign_id := campaign_record.id;
        
        -- Create 2-4 briefs per campaign
        FOR i IN 1..floor(random()*3)+2 LOOP
            -- Determine resource type based on content
            IF random() < 0.3 THEN 
                resource_type_var := 'internal';
            ELSE 
                resource_type_var := (ARRAY['agency', 'freelancer'])[floor(random() * 2) + 1];
            END IF;
            
            -- Get a random resource of the determined type
            SELECT id INTO resource_id FROM public.resources 
            WHERE name LIKE 'Demo%' AND type = resource_type_var::resource_type
            ORDER BY random() LIMIT 1;
            
            -- Get a random user ID
            SELECT id INTO user_id FROM public.users 
            WHERE email LIKE '%.demo@example.com'
            ORDER BY random() LIMIT 1;
            
            -- Set title based on campaign
            brief_title := 'Demo Brief: ' || 
                           substring(campaign_record.name FROM 6) || ' - ' || 
                           (CASE 
                               WHEN i = 1 THEN 'Product Photography'
                               WHEN i = 2 THEN 'Digital Marketing'
                               WHEN i = 3 THEN 'Catalog Design'
                               ELSE 'Home Decor Content ' || i::TEXT
                            END);
            
            -- Set status based on campaign status
            IF campaign_record.status = 'complete' THEN
                brief_status := 'complete';
            ELSIF campaign_record.status = 'active' THEN
                brief_status := status_array[(floor(random() * 3) + 2)]::brief_status;
            ELSE
                brief_status := 'draft';
            END IF;
            
            -- Set start date at least 1-2 weeks before due date
            brief_start_date := campaign_record.start_date - (floor(random() * 7) + 7)::INTEGER;
            
            -- Set due date based on campaign timeline
            brief_due_date := campaign_record.start_date + 
                        (floor(random() * (campaign_record.end_date - campaign_record.start_date) / 3))::INTEGER;
            
            -- Set created_at timestamp
            created_at := brief_start_date - (floor(random() * 12) + 3)::INTEGER * INTERVAL '1 day' + 
                         floor(random() * 12)::INTEGER * INTERVAL '1 hour';
                         
            -- Set priority
            priority := priority_array[(floor(random() * 4) + 1)]::priority_level;
            
            -- Set channel
            channel_value := channel_array[(floor(random() * array_length(channel_array, 1)) + 1)];
            
            -- Set description
            brief_description := home_descriptions[(floor(random() * array_length(home_descriptions, 1)) + 1)];
            
            -- Insert the brief
            INSERT INTO public.briefs (
                title, 
                description, 
                status, 
                campaign_id,
                resource_id,
                start_date,
                due_date,
                created_at,
                updated_at,
                priority,
                brand_id,
                channel,
                created_by,
                estimated_hours
            ) VALUES (
                brief_title,
                brief_description,
                brief_status,
                campaign_id,
                resource_id,
                brief_start_date,
                brief_due_date,
                created_at,
                created_at + (floor(random() * 24) + 1)::INTEGER * INTERVAL '1 hour',
                priority,
                (SELECT brand_id FROM public.campaigns WHERE id = campaign_id),
                channel_value,
                user_id,
                (floor(random() * 20) + 5)::INTEGER
            );
            
            brief_count := brief_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % home brand briefs', brief_count;
END;
$$;

-- Create standalone briefs (not connected to campaigns)
DO $$
DECLARE
    brief_count INTEGER := 0;
    resource_id UUID;
    brief_title TEXT;
    brief_status brief_status;
    brief_start_date DATE;
    brief_due_date DATE;
    brief_description TEXT;
    created_at TIMESTAMP;
    priority priority_level;
    channel_value TEXT;
    user_id UUID;
    brand_id UUID;
    status_array TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
    priority_array TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    channel_array TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print'];
    resource_type_var TEXT;
    brands_array UUID[];
    standalone_descriptions TEXT[] := ARRAY[
        'Create social media profile graphics',
        'Design email signature template',
        'Create brand style guide update',
        'Design presentation template',
        'Create social media content calendar',
        'Design trade show booth graphics',
        'Create corporate brochure template',
        'Design website banner update',
        'Create seasonal promotional graphics'
    ];
BEGIN
    -- Get all brand IDs
    SELECT array_agg(id) INTO brands_array FROM public.brands WHERE name LIKE 'Demo%';
    
    -- Create 20-30 standalone briefs
    FOR i IN 1..floor(random()*11)+20 LOOP
        -- Determine resource type
        IF random() < 0.3 THEN 
            resource_type_var := 'internal';
        ELSE 
            resource_type_var := (ARRAY['agency', 'freelancer'])[floor(random() * 2) + 1];
        END IF;
        
        -- Get a random resource of the determined type
        SELECT id INTO resource_id FROM public.resources 
        WHERE name LIKE 'Demo%' AND type = resource_type_var::resource_type
        ORDER BY random() LIMIT 1;
        
        -- Get a random user ID
        SELECT id INTO user_id FROM public.users 
        WHERE email LIKE '%.demo@example.com'
        ORDER BY random() LIMIT 1;
        
        -- Get a random brand
        brand_id := brands_array[(floor(random() * array_length(brands_array, 1)) + 1)];
        
        -- Set title
        brief_title := 'Demo Standalone Brief: ' || (
            CASE floor(random() * 6)
                WHEN 0 THEN 'Brand Asset'
                WHEN 1 THEN 'Website Update'
                WHEN 2 THEN 'Marketing Material'
                WHEN 3 THEN 'Social Media Content'
                WHEN 4 THEN 'Corporate Communication'
                ELSE 'General Creative'
            END
        ) || ' - ' || to_char(CURRENT_DATE, 'Mon') || ' ' || i;
        
        -- Set status with weighting toward completed or in progress
        IF random() < 0.4 THEN
            brief_status := 'complete';
        ELSIF random() < 0.7 THEN
            brief_status := 'in_progress';
        ELSE
            brief_status := status_array[(floor(random() * 6) + 1)]::brief_status;
        END IF;
        
        -- Set dates
        brief_start_date := CURRENT_DATE - (floor(random() * 60) + 10)::INTEGER;
        brief_due_date := CURRENT_DATE + (floor(random() * 60) - 30)::INTEGER;
        
        -- Adjust dates if they're not in chronological order
        IF brief_due_date <= brief_start_date THEN
            brief_due_date := brief_start_date + (floor(random() * 14) + 7)::INTEGER;
        END IF;
        
        -- Set created_at timestamp (between 1-4 weeks before due date)
        created_at := brief_start_date - (floor(random() * 21) + 7)::INTEGER * INTERVAL '1 day' + 
                     floor(random() * 12)::INTEGER * INTERVAL '1 hour';
                     
        -- Set priority
        priority := priority_array[(floor(random() * 4) + 1)]::priority_level;
        
        -- Set channel
        channel_value := channel_array[(floor(random() * array_length(channel_array, 1)) + 1)];
        
        -- Set description
        brief_description := standalone_descriptions[(floor(random() * array_length(standalone_descriptions, 1)) + 1)];
        
        -- Insert the brief
        INSERT INTO public.briefs (
            title, 
            description, 
            status, 
            resource_id,
            start_date,
            due_date,
            created_at,
            updated_at,
            priority,
            brand_id,
            channel,
            created_by,
            estimated_hours
        ) VALUES (
            brief_title,
            brief_description,
            brief_status,
            resource_id,
            brief_start_date,
            brief_due_date,
            created_at,
            created_at + (floor(random() * 48) + 1)::INTEGER * INTERVAL '1 hour',
            priority,
            brand_id,
            channel_value,
            user_id,
            (floor(random() * 20) + 5)::INTEGER
        );
        
        brief_count := brief_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % standalone briefs', brief_count;
END;
$$;

-- Output brief counts
DO $$
DECLARE
    total_briefs INTEGER;
    draft_briefs INTEGER;
    approved_briefs INTEGER;
    in_progress_briefs INTEGER;
    review_briefs INTEGER;
    complete_briefs INTEGER;
    cancelled_briefs INTEGER;
    campaign_briefs INTEGER;
    standalone_briefs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_briefs FROM public.briefs WHERE title LIKE 'Demo%';
    SELECT COUNT(*) INTO draft_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'draft';
    SELECT COUNT(*) INTO approved_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'approved';
    SELECT COUNT(*) INTO in_progress_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'in_progress';
    SELECT COUNT(*) INTO review_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'review';
    SELECT COUNT(*) INTO complete_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'complete';
    SELECT COUNT(*) INTO cancelled_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND status = 'cancelled';
    SELECT COUNT(*) INTO campaign_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND campaign_id IS NOT NULL;
    SELECT COUNT(*) INTO standalone_briefs FROM public.briefs WHERE title LIKE 'Demo%' AND campaign_id IS NULL;
    
    RAISE NOTICE 'Demo briefs created: %', total_briefs;
    RAISE NOTICE 'Status breakdown: % draft, % approved, % in-progress, % review, % complete, % cancelled', 
        draft_briefs, approved_briefs, in_progress_briefs, review_briefs, complete_briefs, cancelled_briefs;
    RAISE NOTICE 'Association: % campaign briefs, % standalone briefs', campaign_briefs, standalone_briefs;
END;
$$; 