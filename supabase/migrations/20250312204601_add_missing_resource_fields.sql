-- Add missing fields to resources table
ALTER TABLE resources 
  ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC DEFAULT 40,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or update the trigger for updated_at on resources
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update any existing resources to have the default capacity
UPDATE resources SET capacity_hours = 40 WHERE capacity_hours IS NULL;