-- Add target_audience_size field to analysis_products table
ALTER TABLE analysis_products 
ADD COLUMN target_audience_size integer;

-- Add comment to explain the column
COMMENT ON COLUMN analysis_products.target_audience_size IS 'Estimated audience size needed to achieve recommended sales quantity';