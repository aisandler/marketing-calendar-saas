-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,  -- Short code for visual display (e.g., "DD")
    color TEXT NOT NULL, -- Hex color code for visualization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_brand_code UNIQUE(code)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index on commonly queried columns
CREATE INDEX idx_brands_code ON brands(code);

-- Add RLS policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Policy for read access (authenticated users can read)
CREATE POLICY "Authenticated users can read brands"
    ON brands FOR SELECT
    TO authenticated
    USING (true);

-- Policy for insert/update/delete (only admins can modify)
CREATE POLICY "Only admins can modify brands"
    ON brands FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 