-- Disable RLS for all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradeshows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;

-- Get the current user's ID (replace with your actual user ID)
-- You can get this by running: SELECT id FROM auth.users WHERE email = 'adam@sandlerdigital.ai';
-- SET user_id = 'your-user-id-here';

-- Add sample resources
INSERT INTO public.resources (name, type, created_at)
VALUES 
  ('Internal Design Team', 'internal', NOW()),
  ('Marketing Agency XYZ', 'agency', NOW()),
  ('John Doe (Freelancer)', 'freelancer', NOW())
ON CONFLICT DO NOTHING;

-- Add sample tradeshows
INSERT INTO public.tradeshows (name, start_date, end_date, description, created_at)
VALUES 
  ('Digital Marketing Expo', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '33 days', 'Annual digital marketing conference', NOW()),
  ('Tech Innovation Summit', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '62 days', 'Technology and innovation showcase', NOW())
ON CONFLICT DO NOTHING;

-- Add sample briefs (replace 'your-user-id-here' with your actual user ID)
-- This assumes you've already created a user and know its ID
DO $$
DECLARE
  user_id UUID;
  resource_id UUID;
BEGIN
  -- Get the first user ID (should be your admin user)
  SELECT id INTO user_id FROM public.users LIMIT 1;
  
  -- Get the first resource ID
  SELECT id INTO resource_id FROM public.resources LIMIT 1;
  
  -- Only proceed if we have a user and resource
  IF user_id IS NOT NULL AND resource_id IS NOT NULL THEN
    -- Add sample briefs
    INSERT INTO public.briefs (
      title, 
      channel, 
      start_date, 
      due_date, 
      resource_id, 
      approver_id, 
      status, 
      priority, 
      description, 
      created_by, 
      created_at, 
      updated_at
    )
    VALUES 
      (
        'Q2 Social Media Campaign', 
        'Social Media', 
        CURRENT_DATE, 
        CURRENT_DATE + INTERVAL '14 days', 
        resource_id, 
        user_id, 
        'draft', 
        'medium', 
        'Create social media content for Q2 product launch', 
        user_id, 
        NOW(), 
        NOW()
      ),
      (
        'Website Redesign', 
        'Website', 
        CURRENT_DATE - INTERVAL '7 days', 
        CURRENT_DATE + INTERVAL '30 days', 
        resource_id, 
        user_id, 
        'in_progress', 
        'high', 
        'Redesign company website with new branding', 
        user_id, 
        NOW(), 
        NOW()
      ),
      (
        'Email Newsletter', 
        'Email', 
        CURRENT_DATE + INTERVAL '3 days', 
        CURRENT_DATE + INTERVAL '10 days', 
        resource_id, 
        user_id, 
        'pending_approval', 
        'low', 
        'Monthly newsletter for April', 
        user_id, 
        NOW(), 
        NOW()
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$; 