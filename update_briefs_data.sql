-- Update briefs data to be more current and realistic
-- Current date reference: March 19, 2025
-- Requirements:
-- 1. Remove older content except for 2-3 past due items
-- 2. Remove "Demo" from all names
-- 3. Add briefs going further out in time
-- 4. Timelines between 3 days and 2 weeks
-- 5. Diversify media types
-- 6. About half of briefs should belong to campaigns

-- First, clean up existing data
DELETE FROM public.briefs 
WHERE due_date < '2025-03-01' 
AND id NOT IN (
  -- Keep just a few past due items to show that condition
  SELECT id FROM public.briefs ORDER BY due_date DESC LIMIT 3
);

-- Update campaigns - remove "Demo" from names
UPDATE public.campaigns 
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Update resources - remove "Demo" from names
UPDATE public.resources
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Update brands - remove "Demo" from brands
UPDATE public.brands
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Update existing briefs - remove "Demo" from titles
UPDATE public.briefs
SET title = regexp_replace(title, 'Demo\s*Brief:\s*', '')
WHERE title LIKE 'Demo Brief:%';

-- Update users - remove "Demo" from emails and names
UPDATE public.users
SET 
  email = regexp_replace(email, '\.demo@', '@'),
  name = regexp_replace(name, 'Demo\s*', '')
WHERE email LIKE '%.demo@example.com' OR name LIKE 'Demo%';

-- Create more campaigns to attach briefs to
DO $$
DECLARE
  brand_id_tech UUID;
  brand_id_health UUID;
  brand_id_urban UUID;
  user_id UUID;
BEGIN
  -- Get brand IDs
  SELECT id INTO brand_id_tech FROM public.brands WHERE name LIKE 'Tech Innovations';
  SELECT id INTO brand_id_health FROM public.brands WHERE name LIKE 'Healthy Living';
  SELECT id INTO brand_id_urban FROM public.brands WHERE name LIKE 'Urban Style';
  
  -- Get a user ID for created_by
  SELECT id INTO user_id FROM public.users ORDER BY random() LIMIT 1;
  
  -- Insert new campaigns
  -- Tech campaigns
  INSERT INTO public.campaigns (
    name, 
    description, 
    start_date, 
    end_date, 
    status, 
    brand_id, 
    created_by
  ) VALUES 
  ('Spring Tech Launch', 'Major product launch for spring line', '2025-03-25', '2025-05-10', 'active', brand_id_tech, user_id),
  ('Summer Tech Showcase', 'Summer technology exhibition and promotion', '2025-05-15', '2025-07-20', 'planned', brand_id_tech, user_id),
  ('Back to School Tech', 'Technology essentials for the new school year', '2025-07-15', '2025-09-05', 'planned', brand_id_tech, user_id);
  
  -- Health campaigns
  INSERT INTO public.campaigns (
    name, 
    description, 
    start_date, 
    end_date, 
    status, 
    brand_id, 
    created_by
  ) VALUES 
  ('Spring Wellness', 'Spring wellness and nutrition campaign', '2025-03-10', '2025-04-30', 'active', brand_id_health, user_id),
  ('Summer Fitness Challenge', 'Summer fitness promotion and challenge', '2025-05-01', '2025-07-15', 'planned', brand_id_health, user_id),
  ('Fall Nutrition', 'Fall nutrition and immunity boost campaign', '2025-08-15', '2025-10-31', 'planned', brand_id_health, user_id);
  
  -- Urban Style campaigns
  INSERT INTO public.campaigns (
    name, 
    description, 
    start_date, 
    end_date, 
    status, 
    brand_id, 
    created_by
  ) VALUES 
  ('Spring Collection', 'Spring apparel and accessories collection', '2025-03-05', '2025-04-25', 'active', brand_id_urban, user_id),
  ('Summer Essentials', 'Summer fashion and lifestyle essentials', '2025-05-01', '2025-07-10', 'planned', brand_id_urban, user_id),
  ('Fall Fashion Preview', 'Early fall fashion preview campaign', '2025-07-25', '2025-09-15', 'planned', brand_id_urban, user_id);
END;
$$;

-- Create new briefs with realistic data
DO $$
DECLARE
  tech_campaign_ids UUID[];
  health_campaign_ids UUID[];
  urban_campaign_ids UUID[];
  
  all_campaign_ids UUID[];
  selected_campaign_id UUID;
  brand_id UUID;
  
  resource_ids UUID[];
  selected_resource UUID;
  
  user_ids UUID[];
  selected_user UUID;
  
  -- Media types with their corresponding frequencies (higher numbers = more common)
  media_types TEXT[] := ARRAY[
    'Social Media', 'Website', 'Email', 'Video', 'Print', 
    'Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'YouTube',
    'Blog Post', 'Infographic', 'Brochure', 'Digital Ad', 'Banner',
    'Product Photography', 'Event Promotion', 'Press Release', 'Podcast'
  ];
  
  media_type TEXT;
  brief_title TEXT;
  brief_description TEXT;
  
  brief_start_date DATE;
  brief_due_date DATE;
  current_date DATE := '2025-03-19'; -- Today's reference date
  random_days INTEGER;
  
  brief_status TEXT;
  status_options TEXT[] := ARRAY['draft', 'pending_approval', 'approved', 'in_progress', 'review', 'complete', 'cancelled'];
  
  -- Brief content arrays for different types of briefs
  tech_titles TEXT[] := ARRAY[
    '10th Anniversary Technology Showcase', 'Product Launch Video Series', 
    'Feature Highlight Social Campaign', 'Tech Comparison Infographic',
    'User Experience Walkthrough', 'Technical Specifications Sheet',
    'Productivity App Promotion', 'Software Update Announcement',
    'Hardware Unboxing Video', 'Tech Webinar Promotion'
  ];
  
  health_titles TEXT[] := ARRAY[
    'Wellness Program Launch', 'Nutrition Guide Infographic', 
    'Fitness Challenge Promotion', 'Healthy Recipe Collection',
    'Vitamin Supplement Campaign', 'Workout Series Videos',
    'Mental Health Awareness', 'Healthy Sleep Habits Guide',
    'Immunity Boost Campaign', 'Natural Ingredients Spotlight'
  ];
  
  urban_titles TEXT[] := ARRAY[
    'Spring Collection Lookbook', 'Summer Essentials Campaign', 
    'Lifestyle Photography Series', 'Fashion Week Coverage',
    'Limited Edition Release', 'Sustainable Fashion Initiative',
    'Accessories Spotlight', 'Brand Ambassador Showcase',
    'New Season Preview', 'Fashion Tips Video Series'
  ];

  descriptions TEXT[] := ARRAY[
    'Create a series of social media posts highlighting key features and benefits',
    'Design an email campaign announcing the new product launch and special offers',
    'Develop a video showcasing the product in action with customer testimonials',
    'Create website banners and landing page assets for the campaign',
    'Design print materials including brochures and point-of-sale displays',
    'Produce a series of Instagram stories featuring behind-the-scenes content',
    'Create a comprehensive digital ad campaign for multiple platforms',
    'Design an infographic comparing our product to competitors',
    'Develop YouTube pre-roll ads highlighting key selling points',
    'Create a LinkedIn content series targeting professional users',
    'Design Facebook carousel ads showcasing product variations',
    'Produce a product photography series for website and catalog use',
    'Create event promotion materials for upcoming launch',
    'Design packaging and labeling for new product line',
    'Develop press release materials and media kit'
  ];
  
  brief_count INTEGER := 0;
  target_brief_count INTEGER := 30; -- Target number of briefs to create
  use_campaign BOOLEAN;
  campaign_chance NUMERIC := 0.5; -- 50% chance of brief belonging to campaign
  
  -- Brief duration factors (in days)
  min_duration INTEGER := 3;
  max_duration INTEGER := 14;
BEGIN
  -- Get campaign IDs by brand
  SELECT ARRAY(
    SELECT id FROM public.campaigns 
    WHERE brand_id = (SELECT id FROM public.brands WHERE name LIKE 'Tech Innovations')
    ORDER BY start_date
  ) INTO tech_campaign_ids;
  
  SELECT ARRAY(
    SELECT id FROM public.campaigns 
    WHERE brand_id = (SELECT id FROM public.brands WHERE name LIKE 'Healthy Living')
    ORDER BY start_date
  ) INTO health_campaign_ids;
  
  SELECT ARRAY(
    SELECT id FROM public.campaigns 
    WHERE brand_id = (SELECT id FROM public.brands WHERE name LIKE 'Urban Style')
    ORDER BY start_date
  ) INTO urban_campaign_ids;
  
  -- Combine all campaign IDs
  all_campaign_ids := tech_campaign_ids || health_campaign_ids || urban_campaign_ids;
  
  -- Get resource IDs
  SELECT ARRAY(SELECT id FROM public.resources ORDER BY id) INTO resource_ids;
  
  -- Get user IDs
  SELECT ARRAY(SELECT id FROM public.users ORDER BY id) INTO user_ids;
  
  -- Create new briefs
  WHILE brief_count < target_brief_count LOOP
    -- Determine if brief belongs to a campaign
    use_campaign := random() < campaign_chance;
    
    -- Select random campaign and get its brand
    IF use_campaign THEN
      selected_campaign_id := all_campaign_ids[floor(random() * array_length(all_campaign_ids, 1)) + 1];
      SELECT brand_id INTO brand_id FROM public.campaigns WHERE id = selected_campaign_id;
    ELSE
      -- Select random brand
      SELECT id INTO brand_id FROM public.brands ORDER BY random() LIMIT 1;
      selected_campaign_id := NULL;
    END IF;
    
    -- Select random resource
    selected_resource := resource_ids[floor(random() * array_length(resource_ids, 1)) + 1];
    
    -- Select random user
    selected_user := user_ids[floor(random() * array_length(user_ids, 1)) + 1];
    
    -- Select random media type
    media_type := media_types[floor(random() * array_length(media_types, 1)) + 1];
    
    -- Generate appropriate title based on brand
    IF brand_id = (SELECT id FROM public.brands WHERE name LIKE 'Tech Innovations') THEN
      brief_title := tech_titles[floor(random() * array_length(tech_titles, 1)) + 1];
    ELSIF brand_id = (SELECT id FROM public.brands WHERE name LIKE 'Healthy Living') THEN
      brief_title := health_titles[floor(random() * array_length(health_titles, 1)) + 1];
    ELSE
      brief_title := urban_titles[floor(random() * array_length(urban_titles, 1)) + 1];
    END IF;
    
    -- Add medium type to make title more specific
    brief_title := brief_title || ' - ' || media_type;
    
    -- Random description
    brief_description := descriptions[floor(random() * array_length(descriptions, 1)) + 1];
    
    -- Determine dates
    IF brief_count < 3 THEN
      -- Past due briefs (only the first 3)
      random_days := floor(random() * 10) + 5; -- 5 to 15 days in the past
      brief_due_date := current_date - random_days;
      
      -- Start date 3-14 days before due date
      random_days := floor(random() * (max_duration - min_duration + 1)) + min_duration;
      brief_start_date := brief_due_date - random_days;
      
      -- Status for past due briefs is typically in_progress, review, or draft
      brief_status := (ARRAY['in_progress', 'review', 'draft'])[floor(random() * 3) + 1];
    ELSE
      -- Future briefs - spread out over the next 6 months
      IF use_campaign AND selected_campaign_id IS NOT NULL THEN
        -- For campaign briefs, use dates within campaign timeframe
        SELECT 
          start_date + floor(random() * (end_date - start_date - max_duration))::integer,
          campaign_record.status
        INTO
          brief_start_date,
          brief_status
        FROM public.campaigns campaign_record
        WHERE id = selected_campaign_id;
        
        -- Ensure brief starts in the future
        IF brief_start_date < current_date THEN
          brief_start_date := current_date + floor(random() * 7)::integer;
        END IF;
        
        -- Due date 3-14 days after start date
        random_days := floor(random() * (max_duration - min_duration + 1)) + min_duration;
        brief_due_date := brief_start_date + random_days;
      ELSE
        -- For non-campaign briefs, spread throughout the next 6 months
        random_days := floor(random() * 180); -- 0 to 180 days in the future
        brief_start_date := current_date + random_days;
        
        -- Due date 3-14 days after start date
        random_days := floor(random() * (max_duration - min_duration + 1)) + min_duration;
        brief_due_date := brief_start_date + random_days;
        
        -- Random status for future briefs
        IF brief_start_date <= current_date THEN
          -- For briefs already started
          brief_status := (ARRAY['in_progress', 'review', 'pending_approval'])[floor(random() * 3) + 1];
        ELSE
          -- For briefs not yet started
          brief_status := (ARRAY['draft', 'pending_approval', 'approved'])[floor(random() * 3) + 1];
        END IF;
      END IF;
    END IF;
    
    -- Insert the brief
    INSERT INTO public.briefs (
      title,
      description,
      campaign_id,
      brand_id,
      resource_id,
      start_date,
      due_date,
      status,
      channel,
      created_by,
      estimated_hours,
      created_at,
      updated_at
    ) VALUES (
      brief_title,
      brief_description,
      selected_campaign_id,
      brand_id,
      selected_resource,
      brief_start_date,
      brief_due_date,
      brief_status::brief_status,
      media_type,
      selected_user,
      floor(random() * 15) + 5, -- 5 to 20 estimated hours
      brief_start_date - (floor(random() * 10) + 1)::integer * INTERVAL '1 day',
      current_date - (floor(random() * 3))::integer * INTERVAL '1 day'
    );
    
    brief_count := brief_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Created % new briefs', brief_count;
END;
$$; 