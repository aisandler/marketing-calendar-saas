-- Demo Data Generation: Teams and Resources
-- This script creates teams and resources for the demo environment

-- Create teams
INSERT INTO public.teams (name, description)
VALUES 
    ('Demo Design', 'Visual design and creative team'),
    ('Demo Content', 'Content creation and copywriting team'),
    ('Demo Digital Marketing', 'Digital and social media marketing team'),
    ('Demo Video Production', 'Video editing and production team'),
    ('Demo Web Development', 'Web and app development team');

-- Store team IDs for reference
DO $$
DECLARE
    design_team_id UUID;
    content_team_id UUID;
    marketing_team_id UUID;
    video_team_id UUID;
    web_team_id UUID;
BEGIN
    SELECT id INTO design_team_id FROM public.teams WHERE name = 'Demo Design';
    SELECT id INTO content_team_id FROM public.teams WHERE name = 'Demo Content';
    SELECT id INTO marketing_team_id FROM public.teams WHERE name = 'Demo Digital Marketing';
    SELECT id INTO video_team_id FROM public.teams WHERE name = 'Demo Video Production';
    SELECT id INTO web_team_id FROM public.teams WHERE name = 'Demo Web Development';
    
    -- Store for later use
    PERFORM set_config('demo.design_team_id', design_team_id::TEXT, FALSE);
    PERFORM set_config('demo.content_team_id', content_team_id::TEXT, FALSE);
    PERFORM set_config('demo.marketing_team_id', marketing_team_id::TEXT, FALSE);
    PERFORM set_config('demo.video_team_id', video_team_id::TEXT, FALSE);
    PERFORM set_config('demo.web_team_id', web_team_id::TEXT, FALSE);
    
    RAISE NOTICE 'Team IDs stored for reference';
END;
$$;

-- Create internal resources
INSERT INTO public.resources (name, type, capacity_hours, team_id, hourly_rate, media_type)
VALUES
    -- Design team
    ('Demo Designer - Sarah', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Design'), 85, 'Graphics'),
    ('Demo Designer - Michael', 'internal', 32, (SELECT id FROM public.teams WHERE name = 'Demo Design'), 75, 'UI/UX'),
    
    -- Content team
    ('Demo Writer - Jessica', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Content'), 65, 'Copy'),
    ('Demo Editor - David', 'internal', 20, (SELECT id FROM public.teams WHERE name = 'Demo Content'), 70, 'Content'),
    
    -- Marketing team
    ('Demo Social Media - Olivia', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Digital Marketing'), 60, 'Social'),
    ('Demo Email Marketer - Noah', 'internal', 30, (SELECT id FROM public.teams WHERE name = 'Demo Digital Marketing'), 65, 'Email'),
    ('Demo Digital Ads - Emma', 'internal', 35, (SELECT id FROM public.teams WHERE name = 'Demo Digital Marketing'), 70, 'Paid Media'),
    
    -- Video team
    ('Demo Videographer - William', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Video Production'), 90, 'Video'),
    ('Demo Video Editor - Sophia', 'internal', 30, (SELECT id FROM public.teams WHERE name = 'Demo Video Production'), 80, 'Video Editing'),
    
    -- Web team
    ('Demo Developer - James', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Web Development'), 100, 'Frontend'),
    ('Demo Developer - Ava', 'internal', 40, (SELECT id FROM public.teams WHERE name = 'Demo Web Development'), 110, 'Backend');

-- Create agency resources
INSERT INTO public.resources (name, type, capacity_hours, hourly_rate, media_type)
VALUES
    ('Demo Creative Agency', 'agency', 100, 150, 'Full Service'),
    ('Demo Video Production Co', 'agency', 60, 175, 'Video'),
    ('Demo Digital Agency', 'agency', 80, 130, 'Digital Marketing'),
    ('Demo PR Firm', 'agency', 40, 160, 'PR');

-- Create freelancer resources
INSERT INTO public.resources (name, type, capacity_hours, hourly_rate, media_type)
VALUES
    ('Demo Freelancer - Alex (Designer)', 'freelancer', 20, 95, 'Graphics'),
    ('Demo Freelancer - Jordan (Writer)', 'freelancer', 25, 85, 'Copy'),
    ('Demo Freelancer - Taylor (Developer)', 'freelancer', 30, 120, 'Web Development'),
    ('Demo Freelancer - Casey (Video)', 'freelancer', 15, 110, 'Video'),
    ('Demo Freelancer - Morgan (Social)', 'freelancer', 20, 75, 'Social Media');

-- Output resource counts
DO $$
DECLARE
    internal_count INTEGER;
    agency_count INTEGER;
    freelancer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO internal_count FROM public.resources WHERE type = 'internal' AND name LIKE 'Demo%';
    SELECT COUNT(*) INTO agency_count FROM public.resources WHERE type = 'agency' AND name LIKE 'Demo%';
    SELECT COUNT(*) INTO freelancer_count FROM public.resources WHERE type = 'freelancer' AND name LIKE 'Demo%';
    
    RAISE NOTICE 'Demo resources created: % internal, % agencies, % freelancers', 
        internal_count, agency_count, freelancer_count;
END;
$$; 