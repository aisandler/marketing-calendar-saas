-- Add brand_id column to briefs table
ALTER TABLE briefs ADD COLUMN brand_id UUID REFERENCES brands(id);