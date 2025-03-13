-- Create a stored function to insert a brand with both name and description
CREATE OR REPLACE FUNCTION insert_brand(brand_name TEXT, brand_description TEXT)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_brand_id UUID;
  result json;
BEGIN
  -- Insert the brand
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING id INTO new_brand_id;
  
  -- Get the full record and return as JSON
  SELECT row_to_json(b)
  FROM brands b
  WHERE id = new_brand_id
  INTO result;
  
  RETURN result;
END;
$$;