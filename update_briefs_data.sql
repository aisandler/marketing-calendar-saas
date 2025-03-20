-- Update briefs data to be more current and realistic
-- Current date reference: March 19, 2025

-- Remove "Demo" prefix from titles
UPDATE public.briefs
SET title = regexp_replace(title, 'Demo\s*Brief:\s*', '')
WHERE title LIKE 'Demo Brief:%';

-- Remove "Demo" from campaigns
UPDATE public.campaigns 
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Remove "Demo" from resources
UPDATE public.resources
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Remove "Demo" from brands
UPDATE public.brands
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Remove "Demo" from user names
UPDATE public.users
SET name = regexp_replace(name, 'Demo\s*', '')
WHERE name LIKE 'Demo%';

-- Update brief dates to spread them over the next few months
-- Get IDs of non-completed briefs first
WITH brief_ids AS (
  SELECT id FROM public.briefs 
  WHERE status NOT IN ('complete', 'cancelled')
  ORDER BY id
), 
numbered_briefs AS (
  SELECT id, row_number() OVER () as rn, 
  (SELECT COUNT(*) FROM brief_ids) as total
  FROM brief_ids
)
UPDATE public.briefs b
SET 
  -- Spread the start dates from today forward about 3 months
  start_date = CURRENT_DATE + (((nb.rn::float / nb.total::float) * 90)::integer || ' days')::interval,
  -- Set due dates to be 3-14 days after start date (realistic timeline)
  due_date = CURRENT_DATE + (((nb.rn::float / nb.total::float) * 90)::integer + (3 + floor(random() * 12))::integer || ' days')::interval,
  -- Update channel with more diverse media types
  channel = (
    CASE floor(random() * 12)
      WHEN 0 THEN 'Website'
      WHEN 1 THEN 'Social Media'
      WHEN 2 THEN 'Email'
      WHEN 3 THEN 'YouTube'
      WHEN 4 THEN 'Instagram'
      WHEN 5 THEN 'Facebook'
      WHEN 6 THEN 'LinkedIn'
      WHEN 7 THEN 'Twitter'
      WHEN 8 THEN 'Blog Post'
      WHEN 9 THEN 'Podcast'
      WHEN 10 THEN 'Print'
      WHEN 11 THEN 'Video'
    END
  )
FROM numbered_briefs nb
WHERE b.id = nb.id;

-- Leave a few past due items for demonstration
WITH past_due_items AS (
  SELECT id FROM public.briefs 
  ORDER BY id
  LIMIT 3
)
UPDATE public.briefs b
SET 
  start_date = CURRENT_DATE - ((10 + floor(random() * 15))::integer || ' days')::interval,
  due_date = CURRENT_DATE - ((3 + floor(random() * 7))::integer || ' days')::interval,
  status = (
    CASE floor(random() * 3)
      WHEN 0 THEN 'in_progress'
      WHEN 1 THEN 'review'
      WHEN 2 THEN 'draft'
    END
  )::brief_status
FROM past_due_items pd
WHERE b.id = pd.id; 

-- Associate more briefs with campaigns to improve grouping functionality
-- First, get all campaign IDs
WITH campaign_ids AS (
  SELECT id FROM public.campaigns
),
-- Get briefs that don't have a campaign
briefs_without_campaign AS (
  SELECT id FROM public.briefs 
  WHERE campaign_id IS NULL
  LIMIT 10 -- Limit to 10 briefs to avoid assigning all briefs to campaigns
),
-- Create a cross join to assign campaigns randomly
campaign_assignments AS (
  SELECT 
    b.id as brief_id,
    (SELECT id FROM campaign_ids ORDER BY random() LIMIT 1) as campaign_id
  FROM briefs_without_campaign b
)
-- Update the briefs with the random campaign assignments
UPDATE public.briefs b
SET campaign_id = ca.campaign_id
FROM campaign_assignments ca
WHERE b.id = ca.brief_id; 