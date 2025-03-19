-- Add resource_id column to briefs table
ALTER TABLE briefs ADD COLUMN resource_id UUID REFERENCES resources(id);