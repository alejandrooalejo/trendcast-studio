-- Add recommended_quantity field to analysis_products table
ALTER TABLE analysis_products 
ADD COLUMN recommended_quantity integer;

-- Add comment to explain the column
COMMENT ON COLUMN analysis_products.recommended_quantity IS 'Recommended manufacturing quantity based on demand score';