-- Update campaign and brief durations to be shorter (4-5 days on average)

-- First, lock both tables to prevent simultaneous updates
BEGIN;

-- 1. Update all campaign durations to be shorter
-- For each campaign, maintain its start date but shorten its end date
UPDATE public.campaigns
SET end_date = start_date + (floor(random() * 3) + 3)::INTEGER * INTERVAL '1 day'
WHERE name LIKE 'Demo%';

-- 2. Update brief durations to match the shorter campaign durations
-- For each brief, retain its start date but adjust its due date
-- Try to ensure the brief due date is within the campaign duration when possible
UPDATE public.briefs b
SET 
    -- Set due date to 2-5 days after start date (resulting in briefs of 2-5 days duration)
    due_date = b.start_date + (floor(random() * 4) + 2)::INTEGER * INTERVAL '1 day'
WHERE 
    -- Only update demo briefs
    title LIKE 'Demo Brief:%';

-- 3. Make sure brief due dates don't exceed campaign end dates
-- This update ensures briefs don't have due dates after campaign end dates
UPDATE public.briefs b
SET due_date = c.end_date
FROM public.campaigns c
WHERE b.campaign_id = c.id
AND b.due_date > c.end_date
AND b.title LIKE 'Demo Brief:%';

-- 4. Fix any brief start dates that are after due dates (which could happen with the random adjustments)
UPDATE public.briefs
SET start_date = due_date - INTERVAL '2 days'
WHERE due_date < start_date
AND title LIKE 'Demo Brief:%';

-- 5. Mark appropriate briefs as complete based on campaign status
UPDATE public.briefs b
SET status = 'complete'
FROM public.campaigns c
WHERE b.campaign_id = c.id
AND c.status = 'complete'
AND b.title LIKE 'Demo Brief:%';

-- 6. Update briefs with future start dates
UPDATE public.briefs
SET status = 'draft'
WHERE start_date > CURRENT_DATE
AND title LIKE 'Demo Brief:%';

COMMIT;

-- Show the updated durations
SELECT 
    'Campaigns' AS entity_type,
    MIN(end_date - start_date) AS min_duration,
    MAX(end_date - start_date) AS max_duration,
    AVG(end_date - start_date) AS avg_duration
FROM public.campaigns
WHERE name LIKE 'Demo%'

UNION ALL

SELECT 
    'Briefs' AS entity_type,
    MIN(due_date - start_date) AS min_duration,
    MAX(due_date - start_date) AS max_duration,
    AVG(due_date - start_date) AS avg_duration
FROM public.briefs
WHERE title LIKE 'Demo Brief:%'; 