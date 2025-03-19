-- Demo Data Generation: Briefs (Part 1 of 2)
-- This script creates briefs for campaigns in various states

-- First section: Creating briefs for tech campaigns
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
    tech_descriptions TEXT[] := ARRAY[
        'Create Facebook ad designs for our tech product campaign',
        'Design social media graphics for product launch',
        'Develop YouTube pre-roll video ad showcasing product features',
        'Create product photography showcasing key features',
        'Design email newsletter template for product announcement',
        'Develop Instagram story series highlighting product benefits',
        'Create SEO-optimized blog post about the new technology',
        'Design LinkedIn carousel post for B2B audience',
        'Create Twitter banner for product campaign',
        'Develop Pinterest pin designs for tech accessories'
    ];
BEGIN
    -- For Demo Tech Innovations campaigns
    FOR campaign_record IN 
        SELECT c.id, c.name, c.start_date, c.end_date, c.status 
        FROM public.campaigns c
        WHERE c.brand_id = (SELECT id FROM public.brands WHERE name = 'Demo Tech Innovations')
        AND c.name LIKE 'Demo%'
    LOOP
        campaign_id := campaign_record.id;
        
        -- Create 3-5 briefs per campaign
        FOR i IN 1..floor(random()*3)+3 LOOP
            -- Get a random resource
            SELECT id INTO resource_id FROM public.resources 
            WHERE name LIKE 'Demo%' AND 
            (media_type IN ('Graphics', 'Video', 'Social', 'Content'))
            ORDER BY random() LIMIT 1;
            
            -- Get a random user ID
            SELECT id INTO user_id FROM public.users 
            WHERE email LIKE '%.demo@example.com'
            ORDER BY random() LIMIT 1;
            
            -- Set title based on campaign
            brief_title := 'Demo Brief: ' || 
                           substring(campaign_record.name FROM 6) || ' - ' || 
                           (CASE 
                               WHEN i = 1 THEN 'Initial Concept'
                               WHEN i = 2 THEN 'Creative Development'
                               WHEN i = 3 THEN 'Production Phase'
                               WHEN i = 4 THEN 'Final Deliverables'
                               ELSE 'Campaign Assets ' || i::TEXT
                            END);
            
            -- Set status based on campaign status
            IF campaign_record.status = 'complete' THEN
                brief_status := (CASE WHEN random() < 0.9 THEN 'complete'::brief_status ELSE 'cancelled'::brief_status END);
            ELSIF campaign_record.status = 'active' THEN
                brief_status := status_array[(floor(random() * 4) + 1)]::brief_status;
            ELSE
                brief_status := status_array[(floor(random() * 2) + 1)]::brief_status;
            END IF;
            
            -- Set start date at least 1-2 weeks before due date
            brief_start_date := campaign_record.start_date - (floor(random() * 7) + 7)::INTEGER;
            
            -- Set due date based on campaign timeline - use a simpler approach to calculate a date between start and middle of campaign
            brief_due_date := campaign_record.start_date + 
                        (floor(random() * (campaign_record.end_date - campaign_record.start_date) / 2))::INTEGER;
            
            -- Set created_at timestamp
            created_at := brief_start_date - (floor(random() * 5) + 2)::INTEGER * INTERVAL '1 day' + 
                         floor(random() * 24)::INTEGER * INTERVAL '1 hour';
                         
            -- Set priority
            priority := priority_array[(floor(random() * 4) + 1)]::priority_level;
            
            -- Set channel
            channel_value := channel_array[(floor(random() * array_length(channel_array, 1)) + 1)];
            
            -- Set description
            brief_description := tech_descriptions[(floor(random() * array_length(tech_descriptions, 1)) + 1)];
            
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
    
    RAISE NOTICE 'Created % tech campaign briefs', brief_count;
END;
$$;

-- Second section: Creating briefs for health campaigns
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
    health_descriptions TEXT[] := ARRAY[
        'Design organic product packaging for new line',
        'Create social media carousel showing health benefits',
        'Develop video testimonials from fitness influencers',
        'Design nutrition infographics for Instagram',
        'Create recipe ebook featuring our products',
        'Design workout plan PDF download',
        'Create Facebook ad campaign for fitness challenge',
        'Design email series for wellness program',
        'Develop website banner for health products',
        'Create Pinterest board with wellness tips'
    ];
BEGIN
    -- For Demo Healthy Living campaigns
    FOR campaign_record IN 
        SELECT c.id, c.name, c.start_date, c.end_date, c.status 
        FROM public.campaigns c
        WHERE c.brand_id = (SELECT id FROM public.brands WHERE name = 'Demo Healthy Living')
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
                               WHEN i = 1 THEN 'Concept Development'
                               WHEN i = 2 THEN 'Content Creation'
                               WHEN i = 3 THEN 'Visual Assets'
                               ELSE 'Campaign Component ' || i::TEXT
                            END);
            
            -- Set status based on campaign status
            IF campaign_record.status = 'complete' THEN
                brief_status := (CASE WHEN random() < 0.9 THEN 'complete'::brief_status ELSE 'cancelled'::brief_status END);
            ELSIF campaign_record.status = 'active' THEN
                brief_status := status_array[(floor(random() * 4) + 2)]::brief_status;
            ELSE
                brief_status := status_array[(floor(random() * 2) + 1)]::brief_status;
            END IF;
            
            -- Set start date at least 1-2 weeks before due date
            brief_start_date := campaign_record.start_date - (floor(random() * 7) + 7)::INTEGER;
            
            -- Set due date based on campaign timeline - use a simpler approach
            brief_due_date := campaign_record.start_date + 
                        (floor(random() * (campaign_record.end_date - campaign_record.start_date) / 2))::INTEGER;
            
            -- Set created_at timestamp
            created_at := brief_start_date - (floor(random() * 5) + 2)::INTEGER * INTERVAL '1 day' + 
                         floor(random() * 12)::INTEGER * INTERVAL '1 hour';
                         
            -- Set priority
            priority := priority_array[(floor(random() * 4) + 1)]::priority_level;
            
            -- Set channel
            channel_value := channel_array[(floor(random() * array_length(channel_array, 1)) + 1)];
            
            -- Set description
            brief_description := health_descriptions[(floor(random() * array_length(health_descriptions, 1)) + 1)];
            
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
    
    RAISE NOTICE 'Created % health campaign briefs', brief_count;
END;
$$; 