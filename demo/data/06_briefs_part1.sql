-- Demo Data Generation: Briefs (Part 1)
-- This script creates helper functions and briefs for completed campaigns

-- Helper function to get random resource by type and team
CREATE OR REPLACE FUNCTION demo_random_resource(resource_type TEXT DEFAULT NULL, media_type TEXT DEFAULT NULL) 
RETURNS UUID AS $$
DECLARE
    result UUID;
BEGIN
    IF resource_type IS NULL AND media_type IS NULL THEN
        SELECT id INTO result FROM public.resources 
        WHERE name LIKE 'Demo%' 
        ORDER BY random() LIMIT 1;
    ELSIF resource_type IS NOT NULL AND media_type IS NULL THEN
        SELECT id INTO result FROM public.resources 
        WHERE name LIKE 'Demo%' AND type = resource_type
        ORDER BY random() LIMIT 1;
    ELSIF resource_type IS NULL AND media_type IS NOT NULL THEN
        SELECT id INTO result FROM public.resources 
        WHERE name LIKE 'Demo%' AND (media_type = media_type OR media_type = 'Full Service')
        ORDER BY random() LIMIT 1;
    ELSE
        SELECT id INTO result FROM public.resources 
        WHERE name LIKE 'Demo%' AND type = resource_type AND (media_type = media_type OR media_type = 'Full Service')
        ORDER BY random() LIMIT 1;
    END IF;
    
    -- If no match, just get a random resource
    IF result IS NULL THEN
        SELECT id INTO result FROM public.resources 
        WHERE name LIKE 'Demo%'
        ORDER BY random() LIMIT 1;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to generate JSON specifications based on channel
CREATE OR REPLACE FUNCTION demo_brief_specs(channel TEXT) 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    CASE 
        WHEN channel = 'Social Media' THEN
            result := jsonb_build_object(
                'platforms', ARRAY[
                    'Instagram', 
                    'Facebook', 
                    'Twitter', 
                    'LinkedIn'
                ][(floor(random() * 3) + 1):],
                'content_types', ARRAY[
                    'Image Post', 
                    'Video', 
                    'Story', 
                    'Reel', 
                    'Carousel'
                ][(floor(random() * 3) + 1):],
                'post_frequency', (floor(random() * 7) + 1)::TEXT || ' posts per week',
                'target_audience', ARRAY[
                    'Young Professionals', 
                    'Parents', 
                    'Tech Enthusiasts', 
                    'Health Conscious Consumers', 
                    'Business Decision Makers'
                ][(floor(random() * 2) + 1):2]
            );
        WHEN channel = 'Email' THEN
            result := jsonb_build_object(
                'email_type', ARRAY[
                    'Newsletter', 
                    'Promotional', 
                    'Product Announcement', 
                    'Event Invitation'
                ][floor(random() * 4) + 1],
                'segments', ARRAY[
                    'All Subscribers', 
                    'Active Customers', 
                    'Dormant Customers', 
                    'New Subscribers'
                ][(floor(random() * 2) + 1):2],
                'preferred_send_day', ARRAY[
                    'Tuesday', 
                    'Wednesday', 
                    'Thursday'
                ][floor(random() * 3) + 1]
            );
        WHEN channel = 'Website' THEN
            result := jsonb_build_object(
                'page_type', ARRAY[
                    'Landing Page', 
                    'Product Page', 
                    'About Us', 
                    'Blog Post', 
                    'Resource Hub'
                ][floor(random() * 5) + 1],
                'expected_word_count', ARRAY[500, 800, 1000, 1500, 2000][floor(random() * 5) + 1],
                'seo_keywords', ARRAY[
                    'innovative solutions', 
                    'industry leader', 
                    'sustainable products', 
                    'professional services', 
                    'customer satisfaction'
                ][(floor(random() * 3) + 1):3]
            );
        WHEN channel = 'Video' THEN
            result := jsonb_build_object(
                'duration', ARRAY[
                    '30 seconds', 
                    '1 minute', 
                    '2-3 minutes', 
                    '5+ minutes'
                ][floor(random() * 4) + 1],
                'style', ARRAY[
                    'Animation', 
                    'Live Action', 
                    'Interview', 
                    'Product Demonstration', 
                    'Testimonial'
                ][floor(random() * 5) + 1],
                'distribution', ARRAY[
                    'YouTube', 
                    'Website', 
                    'Social Media', 
                    'Sales Presentations'
                ][(floor(random() * 2) + 1):3]
            );
        WHEN channel = 'Print' THEN
            result := jsonb_build_object(
                'format', ARRAY[
                    'Brochure', 
                    'Flyer', 
                    'Magazine Ad', 
                    'Poster', 
                    'Direct Mail'
                ][floor(random() * 5) + 1],
                'size', ARRAY[
                    'Letter', 
                    'A4', 
                    'Tri-fold', 
                    'Half Page', 
                    'Full Page'
                ][floor(random() * 5) + 1],
                'quantity', ARRAY[500, 1000, 2500, 5000, 10000][floor(random() * 5) + 1]
            );
        ELSE
            result := jsonb_build_object(
                'details', 'Standard brief with generic requirements',
                'notes', 'Please contact marketing team for specific details'
            );
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a batch of briefs for completed campaigns
DO $$
DECLARE
    campaign_rec RECORD;
    brand_id UUID;
    brief_count INTEGER := 0;
    channels TEXT[] := ARRAY['Social Media', 'Email', 'Website', 'Video', 'Print', 'Digital Ads', 'PR', 'Event'];
    statuses TEXT[] := ARRAY['draft', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
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
    -- Loop through completed campaigns
    FOR campaign_rec IN (
        SELECT id, brand_id, start_date AS campaign_start, end_date AS campaign_end 
        FROM public.campaigns 
        WHERE name LIKE 'Demo%' AND status = 'complete'
    ) LOOP
        -- Create 3-7 briefs per completed campaign
        FOR i IN 1..floor(random() * 5 + 3) LOOP
            -- Random values
            rand_channel := channels[floor(random() * array_length(channels, 1)) + 1];
            rand_status := 'complete'; -- All briefs in completed campaigns are complete
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
            
            -- Generate realistic dates within campaign timeframe
            start_date := demo_random_date(campaign_rec.campaign_start, campaign_rec.campaign_start + INTERVAL '15 days');
            due_date := demo_random_date(start_date + INTERVAL '5 days', campaign_rec.campaign_end - INTERVAL '5 days');
            created_at := (start_date - INTERVAL '5 days')::TIMESTAMP WITH TIME ZONE;
            
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
    
    RAISE NOTICE 'Created % briefs for completed campaigns', brief_count;
END;
$$; 