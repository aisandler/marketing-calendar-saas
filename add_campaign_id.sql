-- Add campaign_id column to briefs table
ALTER TABLE briefs ADD COLUMN campaign_id UUID REFERENCES campaigns(id);