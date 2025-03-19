-- Insert default brand if none exists
INSERT INTO brands (name, description)
SELECT 'Default Brand', 'Default brand for migration purposes'
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);