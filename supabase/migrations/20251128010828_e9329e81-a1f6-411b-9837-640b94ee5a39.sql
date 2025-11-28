-- Add price estimation fields to analysis_products
ALTER TABLE analysis_products 
ADD COLUMN estimated_price DECIMAL(10,2),
ADD COLUMN projected_revenue DECIMAL(10,2);